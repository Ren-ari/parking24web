using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Parking24web.Server.Services;
using Parking24web.Server.Models;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace Parking24web.Server.Hubs
{
    public class PLCHub : Hub
    {
        private readonly PLCService _plcService;
        private readonly ILogger<PLCHub> _logger;
        private readonly IHubContext<PLCHub> _hubContext;
        private readonly SiteConfiguration _siteConfig;

        // 리소스별 세마포어 (동시성 제어)
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _resourceLocks = new();

        // 리소스별 시퀀스 관리
        private static readonly ConcurrentDictionary<string, ResourceInfo> _resourceInfo = new();

        // TTL 설정 (5초)
        private const int COMMAND_TTL_MS = 5000;

        public PLCHub(
            PLCService plcService,
            ILogger<PLCHub> logger,
            IHubContext<PLCHub> hubContext,
            IOptions<SiteConfiguration> siteConfig)
        {
            _plcService = plcService;
            _logger = logger;
            _hubContext = hubContext;
            _siteConfig = siteConfig.Value;
        }

        #region 연결 관리

        public async Task<bool> ConnectToPLC(string ip, int port)
        {
            try
            {
                _logger.LogInformation($"PLC 연결 시도: {ip}:{port}");

                bool connected = await _plcService.ConnectAsync(ip, port);

                if (connected)
                {
                    await Clients.All.SendAsync("PLCConnectionChanged", true);
                    _logger.LogInformation("PLC 연결 성공");

                    // 인증 확인
                    bool authenticated = await _plcService.AuthenticateAsync();
                    await Clients.All.SendAsync("PLCAuthenticated", authenticated);

                    return true;
                }
                else
                {
                    await Clients.All.SendAsync("PLCConnectionChanged", false);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PLC 연결 중 오류 발생");
                await Clients.Caller.SendAsync("Error", $"PLC 연결 실패: {ex.Message}");
                return false;
            }
        }

        public async Task DisconnectFromPLC()
        {
            try
            {
                _plcService.Disconnect();
                await Clients.All.SendAsync("PLCConnectionChanged", false);
                _logger.LogInformation("PLC 연결 해제");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PLC 연결 해제 중 오류");
                await Clients.Caller.SendAsync("Error", $"연결 해제 실패: {ex.Message}");
            }
        }

        public async Task<bool> GetPLCStatus()
        {
            return _plcService.IsConnected;
        }

        #endregion

        #region 센서 데이터

        public async Task RequestSensorData()
        {
            try
            {
                if (!_plcService.IsConnected)
                {
                    await Clients.Caller.SendAsync("Error", "PLC가 연결되지 않았습니다");
                    return;
                }

                var sensorData = _plcService.GetSensorData();
                var parsedData = _plcService.GetParsedSensorData();

                await Clients.Caller.SendAsync("SensorDataUpdate", new
                {
                    timestamp = DateTime.Now,
                    connected = _plcService.IsConnected,
                    rawData = sensorData,
                    parsedData = parsedData
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "센서 데이터 요청 중 오류");
                await Clients.Caller.SendAsync("Error", $"센서 데이터 오류: {ex.Message}");
            }
        }

        #endregion

        #region 현장 설정 관리

        public async Task GetCurrentSiteConfiguration()
        {
            try
            {
                await Clients.Caller.SendAsync("CurrentSiteConfiguration", new
                {
                    siteName = _siteConfig.SiteInfo?.Name ?? "Unknown",
                    unitNumber = _siteConfig.SiteInfo?.UnitNumber ?? "Unknown",
                    location = _siteConfig.SiteInfo?.Location ?? "",
                    commandCount = _siteConfig.ControlCommands?.Count ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "현장 설정 정보 전송 중 오류");
                await Clients.Caller.SendAsync("Error", $"설정 정보 오류: {ex.Message}");
            }
        }

        private CommandConfig? GetCommandConfig(string commandName)
        {
            if (_siteConfig.ControlCommands == null)
            {
                _logger.LogWarning($"제어 명령 설정이 로드되지 않았습니다: {commandName}");
                return null;
            }

            var command = _siteConfig.ControlCommands.FirstOrDefault(
                x => x.Key.Equals(commandName, StringComparison.OrdinalIgnoreCase)
            );

            if (command.Value != null)
            {
                _logger.LogDebug($"명령 설정 조회: {commandName} = {command.Value.DeviceType}{command.Value.Address}");
                return command.Value;
            }

            _logger.LogWarning($"명령 설정을 찾을 수 없습니다: {commandName}");
            return null;
        }

        private int GetSystemAddress(string addressName)
        {
            if (_siteConfig.SystemAddresses == null)
            {
                _logger.LogWarning($"시스템 주소 설정이 로드되지 않았습니다: {addressName}");
                return -1;
            }

            var property = _siteConfig.SystemAddresses.GetType().GetProperty(
                addressName,
                System.Reflection.BindingFlags.IgnoreCase | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance
            );

            if (property != null && property.GetValue(_siteConfig.SystemAddresses) is int address)
            {
                _logger.LogDebug($"시스템 주소 조회: {addressName} = C{address}");
                return address;
            }

            _logger.LogWarning($"시스템 주소를 찾을 수 없습니다: {addressName}");
            return -1;
        }

        #endregion

        #region 핵심: Config 기반 명령 전송 (개선 버전)

        /// <summary>
        /// Config 기반 명령 전송 - 중복 제거, 안전성 강화
        /// </summary>
        public async Task<CommandResult> SendConfigCommand(CommandRequest request)
        {
            var sw = Stopwatch.StartNew();
            var resourceKey = request.ResourceKey;

            _logger.LogInformation(
                "[{CommandId}] 명령 시작: {Command}={Value} [resource:{Resource}, idempotency:{Key}, immediate:{Immediate}]",
                request.CommandId, request.CommandName, request.Value, resourceKey,
                request.IdempotencyKey, request.Immediate
            );

            try
            {
                // ============================================
                // 1. 명령 설정 조회
                // ============================================
                var commandConfig = GetCommandConfig(request.CommandName);
                if (commandConfig == null)
                {
                    throw new Exception($"명령 설정을 찾을 수 없음: {request.CommandName}");
                }

                // ============================================
                // 2. 리소스별 세마포어 획득
                // ============================================
                var resourceLock = _resourceLocks.GetOrAdd(resourceKey, _ => new SemaphoreSlim(1, 1));

                // TTL 체크 (대기 시간이 5초 넘으면 실패)
                var acquireTask = resourceLock.WaitAsync(COMMAND_TTL_MS);
                if (!await acquireTask)
                {
                    throw new TimeoutException($"리소스 락 대기 시간 초과: {resourceKey}");
                }

                try
                {
                    // ============================================
                    // 3. PLC 연결 체크
                    // ============================================
                    if (!_plcService.IsConnected)
                    {
                        throw new Exception("PLC 연결 끊김");
                    }

                    // ============================================
                    // 4. 시퀀스 증가 (리소스별)
                    // ============================================
                    var resourceInfo = _resourceInfo.GetOrAdd(resourceKey, _ => new ResourceInfo
                    {
                        ResourceKey = resourceKey,
                        Sequence = 0
                    });

                    resourceInfo.Sequence++;
                    resourceInfo.LastCommandTime = DateTime.UtcNow;
                    resourceInfo.LastCommandId = request.CommandId;

                    var currentSequence = resourceInfo.Sequence;

                    // ============================================
                    // 5. PLC 쓰기
                    // ============================================
                    if (commandConfig.BitPosition.HasValue)
                    {
                        _plcService.WriteBit(
                            commandConfig.DeviceType,
                            commandConfig.Address,
                            commandConfig.BitPosition.Value,
                            request.Value > 0
                        );

                        _logger.LogInformation(
                            "[{CommandId}] 비트 쓰기: {Command} ({Device}{Address}.{Bit}) = {Value} [seq:{Seq}]",
                            request.CommandId, request.CommandName, commandConfig.DeviceType,
                            commandConfig.Address, commandConfig.BitPosition, request.Value, currentSequence
                        );
                    }
                    else
                    {
                        _plcService.WriteWord(
                            commandConfig.DeviceType,
                            commandConfig.Address,
                            (ushort)request.Value
                        );

                        _logger.LogInformation(
                            "[{CommandId}] 워드 쓰기: {Command} ({Device}{Address}) = {Value} [seq:{Seq}]",
                            request.CommandId, request.CommandName, commandConfig.DeviceType,
                            commandConfig.Address, request.Value, currentSequence
                        );
                    }

                    sw.Stop();

                    // ============================================
                    // 6. 성공 응답
                    // ============================================
                    return new CommandResult
                    {
                        Success = true,
                        Message = "명령 전송 완료",
                        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                        IdempotencyKey = request.IdempotencyKey,
                        CommandId = request.CommandId,
                        Sequence = currentSequence,
                        ResourceKey = resourceKey,
                        ElapsedMs = sw.ElapsedMilliseconds
                    };
                }
                finally
                {
                    // ============================================
                    // 7. 세마포어 해제 (무조건 실행)
                    // ============================================
                    resourceLock.Release();
                    _logger.LogDebug("[{CommandId}] 리소스 락 해제: {Resource}", request.CommandId, resourceKey);
                }
            }
            catch (Exception ex)
            {
                sw.Stop();

                _logger.LogError(ex,
                    "[{CommandId}] 명령 실패: {Command}={Value} ({Ms}ms) - {Error}",
                    request.CommandId, request.CommandName, request.Value, sw.ElapsedMilliseconds, ex.Message
                );

                // ============================================
                // 8. 실패 응답
                // ============================================
                return new CommandResult
                {
                    Success = false,
                    Message = ex.Message,
                    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    IdempotencyKey = request.IdempotencyKey,
                    CommandId = request.CommandId,
                    Sequence = 0,
                    ResourceKey = resourceKey,
                    ElapsedMs = sw.ElapsedMilliseconds
                };
            }
        }

        /// <summary>
        /// 명령 이름에서 리소스 키 추출 (간단 버전)
        /// </summary>
        private string GetResourceKeyFromCommandName(string commandName)
        {
            var cmd = commandName.ToLower();
            if (cmd.Contains("lift")) return "lift";
            if (cmd.Contains("door")) return "door";
            if (cmd.Contains("turn")) return "turn";
            if (cmd.Contains("move")) return "traverse";
            if (cmd.Contains("locking")) return "locking";
            return "system";
        }

        #endregion

        #region 범용 PLC 제어

        public async Task SendPLCCommand(PLCCommandRequest request)
        {
            try
            {
                if (!_plcService.IsConnected)
                {
                    await Clients.Caller.SendAsync("Error", "PLC가 연결되지 않았습니다");
                    return;
                }

                switch (request.CommandType.ToLower())
                {
                    case "writeword":
                        _plcService.WriteWord(request.DeviceType, request.Address, (ushort)request.Value);
                        break;

                    case "writebit":
                        _plcService.WriteBit(request.DeviceType, request.Address, request.BitPosition, request.Value > 0);
                        break;

                    default:
                        await Clients.Caller.SendAsync("Error", $"알 수 없는 명령: {request.CommandType}");
                        return;
                }

                _logger.LogInformation($"PLC 명령 전송: {request.CommandType} {request.DeviceType}{request.Address} = {request.Value}");
                await Clients.Caller.SendAsync("CommandExecuted", request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PLC 명령 전송 중 오류");
                await Clients.Caller.SendAsync("Error", $"명령 전송 실패: {ex.Message}");
            }
        }

        #endregion

        #region Config 기반 수동 제어 명령들

        #endregion

        #region SignalR 이벤트

        private static Timer? _broadcastTimer;
        private static bool _isMonitoring = false;

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("PLCConnectionChanged", _plcService.IsConnected);
            _logger.LogInformation($"클라이언트 연결: {Context.ConnectionId}");

            await GetCurrentSiteConfiguration();

            if (!_isMonitoring)
            {
                _isMonitoring = true;
                _broadcastTimer = new Timer(async _ =>
                {
                    if (_plcService.IsConnected)
                    {
                        var data = _plcService.GetSensorData();
                        var parsedData = _plcService.GetParsedSensorData();

                        await _hubContext.Clients.All.SendAsync("SensorDataUpdate", new
                        {
                            timestamp = DateTime.Now,
                            connected = _plcService.IsConnected,
                            rawData = data,
                            parsedData = parsedData
                        });
                    }
                }, null, 0, 100);

                _logger.LogInformation("실시간 모니터링 시작");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"클라이언트 연결 해제: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        #endregion
    }

    // PLC 명령 요청 클래스 (범용)
    public class PLCCommandRequest
    {
        public string CommandType { get; set; } = string.Empty;
        public string DeviceType { get; set; } = "C";
        public int Address { get; set; }
        public int BitPosition { get; set; } = 0;
        public int Value { get; set; }
    }
}