using Parking24web.Server.Models;
using System.Diagnostics;
using System.Net;

namespace Parking24web.Server.Services
{
    public class CCTVService : IDisposable
    {
        private readonly ILogger<CCTVService> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _configuration;
        private HttpClient _httpClient;
        private bool _isConnected = false;
        private int _currentChannel = 33;
        private string _statusMessage = "준비됨";
        private string _ipAddress = "";
        private string _username = "";
        private string _password = "";
        private ushort _port = 8080;
        private ushort _rtspPort = 8888;
        private readonly Dictionary<int, Process> _hlsProcesses = new();
        private readonly object _hlsSync = new();
        private readonly string _dataRoot;
        private readonly string _ffmpegPath;

        public CCTVService(ILogger<CCTVService> logger, IWebHostEnvironment env, IConfiguration configuration)
        {
            _logger = logger;
            _env = env;
            _configuration = configuration;
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

            // 데이터 저장 경로
            var programData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
            _dataRoot = Path.Combine(programData, "Parking24web");
            Directory.CreateDirectory(_dataRoot);
            Directory.CreateDirectory(Path.Combine(_dataRoot, "hls"));

            // FFmpeg 경로 (appsettings.json에서 읽거나 기본값)
            _ffmpegPath = configuration.GetValue<string>("FFmpeg:Path") ?? "ffmpeg";

            _logger.LogInformation("CCTVService 초기화 완료. 데이터 경로: {DataRoot}", _dataRoot);
        }

        public async Task<CCTVConnectResult> ConnectAsync(string ipAddress, ushort port, string username, string password, ushort rtspPort)
        {
            try
            {
                _ipAddress = ipAddress;
                _port = port;
                _username = username;
                _password = password;
                _rtspPort = rtspPort;

                // Digest 인증 지원 HttpClient 재생성
                _httpClient.Dispose();
                var handler = new HttpClientHandler
                {
                    Credentials = new NetworkCredential(username, password),
                    PreAuthenticate = false,
                    AllowAutoRedirect = true
                };
                _httpClient = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(10) };

                // 하이크비전 ISAPI 연결 테스트
                var testUrl = $"http://{ipAddress}:{port}/ISAPI/System/deviceInfo";
                _logger.LogInformation("하이크비전 연결 테스트: {Url}", testUrl);

                var response = await _httpClient.GetAsync(testUrl);

                if (response.IsSuccessStatusCode)
                {
                    _isConnected = true;
                    _statusMessage = "하이크비전 연결 성공";
                    _logger.LogInformation("하이크비전 연결 성공");
                    return new CCTVConnectResult { Success = true, Message = "연결 성공" };
                }
                else
                {
                    var errorMessage = $"연결 실패: {response.StatusCode}";
                    _statusMessage = errorMessage;
                    _isConnected = false;
                    _logger.LogError("하이크비전 연결 실패: {StatusCode}", response.StatusCode);
                    return new CCTVConnectResult { Success = false, Message = errorMessage };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "하이크비전 연결 중 오류");
                return new CCTVConnectResult { Success = false, Message = $"연결 오류: {ex.Message}" };
            }
        }

        public void Disconnect()
        {
            try
            {
                _isConnected = false;
                _statusMessage = "연결 종료됨";
                _httpClient.DefaultRequestHeaders.Authorization = null;

                // 모든 HLS 프로세스 종료
                foreach (var kv in _hlsProcesses.ToList())
                {
                    try { if (!kv.Value.HasExited) kv.Value.Kill(true); } catch { }
                    try { kv.Value.Dispose(); } catch { }
                    _hlsProcesses.Remove(kv.Key);
                }

                _logger.LogInformation("하이크비전 연결 해제됨");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "연결 해제 중 오류");
            }
        }

        public CCTVStatus GetStatus()
        {
            return new CCTVStatus
            {
                IsConnected = _isConnected,
                StatusMessage = _statusMessage,
                CurrentChannel = _currentChannel,
                LastUpdate = DateTime.Now,
                IsStreaming = _hlsProcesses.Count > 0,
                ConnectionInfo = _isConnected ? $"{_ipAddress}:{_port}" : "연결 안됨"
            };
        }

        public void ChangeChannel(int channelNumber, bool restartHls = false, string stream = "main")
        {
            try
            {
                if (!_isConnected)
                {
                    throw new InvalidOperationException("CCTV가 연결되지 않았습니다");
                }

                _currentChannel = channelNumber;
                _statusMessage = $"채널 {channelNumber}로 변경됨";
                _logger.LogInformation("채널 변경: {ChannelNumber}", channelNumber);

                if (restartHls && _hlsProcesses.Count > 0)
                {
                    foreach (var ch in _hlsProcesses.Keys.ToList())
                    {
                        try { StopHls(ch); } catch { }
                    }
                    StartHls(channelNumber, stream);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "채널 변경 중 오류");
                throw;
            }
        }

        public string GetHlsUrl(int channelNumber)
        {
            return $"/hls/ch{channelNumber}/index.m3u8";
        }

        public bool StartHls(int channelNumber, string stream = "main")
        {
            if (!_isConnected)
            {
                _logger.LogWarning("HLS 시작 실패: 연결 안됨");
                return false;
            }

            lock (_hlsSync)
            {
                try
                {
                    // 이미 실행 중이면 스킵
                    if (_hlsProcesses.TryGetValue(channelNumber, out var existing) && existing != null && !existing.HasExited)
                    {
                        _logger.LogInformation("HLS 이미 실행 중: 채널 {Channel}", channelNumber);
                        return true;
                    }

                    StopHls(channelNumber);

                    var outDir = Path.Combine(_dataRoot, "hls", $"ch{channelNumber}");
                    Directory.CreateDirectory(outDir);

                    // 기존 파일 정리
                    foreach (var f in Directory.EnumerateFiles(outDir, "*", SearchOption.TopDirectoryOnly))
                    {
                        try { File.Delete(f); } catch { }
                    }

                    // RTSP URL 생성 (메인/서브 선택)
                    var isSub = string.Equals(stream, "sub", StringComparison.OrdinalIgnoreCase);
                    var streamingChannel = channelNumber * 100 + (isSub ? 2 : 1);
                    var rtspUrl = $"rtsp://{_username}:{_password}@{_ipAddress}:{_rtspPort}/Streaming/Channels/{streamingChannel}";

                    // FFmpeg 명령어 (1초 지연 최적화)
                    var args = $"-rtsp_transport tcp -i \"{rtspUrl}\" " +
                               $"-an -c:v libx264 -preset ultrafast -tune zerolatency " +
                               $"-vf scale=-2:480,format=yuv420p " +
                               $"-b:v 1000k -maxrate 1200k -bufsize 1000k " +
                               $"-g 12 -keyint_min 12 -sc_threshold 0 " +
                               $"-profile:v baseline -level 3.1 " +
                               $"-max_muxing_queue_size 1024 " +
                               $"-f hls -hls_time 0.5 -hls_list_size 10 " +
                               $"-hls_flags delete_segments+omit_endlist+independent_segments+program_date_time " +
                               $"-hls_segment_filename \"{Path.Combine(outDir, "%03d.ts")}\" " +
                               $"\"{Path.Combine(outDir, "index.m3u8")}\"";

                    var psi = new ProcessStartInfo
                    {
                        FileName = _ffmpegPath,
                        Arguments = args,
                        UseShellExecute = false,
                        RedirectStandardError = true,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    };

                    var proc = new Process { StartInfo = psi, EnableRaisingEvents = true };
                    proc.ErrorDataReceived += (s, e) => { if (!string.IsNullOrWhiteSpace(e.Data)) _logger.LogDebug("[FFmpeg] {Data}", e.Data); };
                    proc.OutputDataReceived += (s, e) => { if (!string.IsNullOrWhiteSpace(e.Data)) _logger.LogDebug("[FFmpeg] {Data}", e.Data); };
                    proc.Exited += (s, e) =>
                    {
                        lock (_hlsSync)
                        {
                            if (_hlsProcesses.TryGetValue(channelNumber, out var p) && (p == null || p.HasExited))
                            {
                                _hlsProcesses.Remove(channelNumber);
                            }
                        }
                    };

                    var started = proc.Start();
                    if (!started)
                    {
                        _logger.LogError("FFmpeg 시작 실패");
                        return false;
                    }

                    proc.BeginErrorReadLine();
                    proc.BeginOutputReadLine();
                    _hlsProcesses[channelNumber] = proc;

                    _logger.LogInformation("HLS 시작 성공: 채널 {Channel} ({Stream})", channelNumber, stream);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "HLS 시작 중 오류: 채널 {Channel}", channelNumber);
                    return false;
                }
            }
        }

        public bool StopHls(int channelNumber)
        {
            lock (_hlsSync)
            {
                try
                {
                    if (_hlsProcesses.TryGetValue(channelNumber, out var proc))
                    {
                        try
                        {
                            if (proc != null && !proc.HasExited)
                            {
                                proc.Kill(true);
                            }
                        }
                        catch { }
                        finally
                        {
                            try { proc?.Dispose(); } catch { }
                            _hlsProcesses.Remove(channelNumber);
                        }
                    }

                    _logger.LogInformation("HLS 중지: 채널 {Channel}", channelNumber);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "HLS 중지 중 오류: 채널 {Channel}", channelNumber);
                    return false;
                }
            }
        }

        public void Dispose()
        {
            try
            {
                Disconnect();
                _httpClient?.Dispose();
                _logger.LogInformation("CCTVService 정리 완료");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CCTVService 정리 중 오류");
            }
        }
    }
}