using Microsoft.AspNetCore.Mvc;
using Parking24web.Server.Services;
using Parking24web.Server.Models;

namespace Parking24web.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CCTVController : ControllerBase
    {
        private readonly CCTVService _cctvService;
        private readonly ILogger<CCTVController> _logger;

        public CCTVController(CCTVService cctvService, ILogger<CCTVController> logger)
        {
            _cctvService = cctvService;
            _logger = logger;
        }

        [HttpPost("connect")]
        public async Task<IActionResult> Connect([FromBody] CCTVConnectRequest request)
        {
            try
            {
                var result = await _cctvService.ConnectAsync(
                    request.IpAddress,
                    request.Port,
                    request.Username,
                    request.Password,
                    request.RtspPort
                );

                if (result.Success)
                {
                    return Ok(new { success = true, message = result.Message });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CCTV 연결 중 오류");
                return StatusCode(500, new { success = false, message = "서버 오류" });
            }
        }

        [HttpPost("disconnect")]
        public IActionResult Disconnect()
        {
            try
            {
                _cctvService.Disconnect();
                return Ok(new { success = true, message = "연결 해제됨" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CCTV 연결 해제 중 오류");
                return StatusCode(500, new { success = false, message = "서버 오류" });
            }
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            try
            {
                var status = _cctvService.GetStatus();
                return Ok(new
                {
                    isConnected = status.IsConnected,
                    statusMessage = status.StatusMessage,
                    currentChannel = status.CurrentChannel,
                    lastUpdate = status.LastUpdate,
                    isStreaming = status.IsStreaming,
                    connectionInfo = status.ConnectionInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CCTV 상태 조회 중 오류");
                return StatusCode(500, new { success = false, message = "서버 오류" });
            }
        }

        [HttpPost("channel/{channelNumber}")]
        public IActionResult ChangeChannel(int channelNumber, [FromQuery] bool restartHls = false, [FromQuery] string stream = "main")
        {
            try
            {
                _cctvService.ChangeChannel(channelNumber, restartHls, stream);
                return Ok(new { success = true, message = $"채널 {channelNumber}로 변경됨", restartHls, stream });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "채널 변경 중 오류: {Channel}", channelNumber);
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("hls/start/{channelNumber}")]
        public IActionResult StartHls(int channelNumber, [FromQuery] string stream = "main")
        {
            try
            {
                var ok = _cctvService.StartHls(channelNumber, stream);
                if (!ok) return BadRequest(new { success = false, message = "HLS 시작 실패" });
                return Ok(new { success = true, url = _cctvService.GetHlsUrl(channelNumber) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HLS 시작 중 오류: {Channel}", channelNumber);
                return StatusCode(500, new { success = false, message = "서버 오류" });
            }
        }

        [HttpPost("hls/stop/{channelNumber}")]
        public IActionResult StopHls(int channelNumber)
        {
            try
            {
                var ok = _cctvService.StopHls(channelNumber);
                return Ok(new { success = ok });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HLS 중지 중 오류: {Channel}", channelNumber);
                return StatusCode(500, new { success = false, message = "서버 오류" });
            }
        }

        [HttpGet("hls/url/{channelNumber}")]
        public IActionResult GetHlsUrl(int channelNumber)
        {
            try
            {
                return Ok(new { url = _cctvService.GetHlsUrl(channelNumber) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HLS URL 조회 중 오류: {Channel}", channelNumber);
                return StatusCode(500, new { success = false, message = "서버 오류" });
            }
        }

        [HttpGet("hls/playlist/{channelNumber}")]
        public IActionResult GetHlsPlaylist(int channelNumber)
        {
            try
            {
                var dataRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Parking24web");
                var baseDir = Path.Combine(dataRoot, "hls", $"ch{channelNumber}");
                var m3u8 = Path.Combine(baseDir, "index.m3u8");
                var m3u8Tmp = Path.Combine(baseDir, "index.m3u8.tmp");

                string? pathToServe = null;
                for (int i = 0; i < 60 && pathToServe == null; i++)
                {
                    if (System.IO.File.Exists(m3u8)) pathToServe = m3u8;
                    else if (System.IO.File.Exists(m3u8Tmp)) pathToServe = m3u8Tmp;
                    else System.Threading.Thread.Sleep(150);
                }

                if (pathToServe == null) return NotFound();

                // 재생목록 읽어서 세그먼트 경로를 절대 URL로 변환
                var text = System.IO.File.ReadAllText(pathToServe);
                var schemeHost = $"{Request.Scheme}://{Request.Host}";
                var lines = text.Replace("\r\n", "\n").Split('\n');
                var sb = new System.Text.StringBuilder();

                foreach (var raw in lines)
                {
                    var line = raw?.TrimEnd('\r') ?? string.Empty;
                    if (line.Length == 0)
                    {
                        sb.AppendLine(line);
                        continue;
                    }
                    if (line.StartsWith("#"))
                    {
                        sb.AppendLine(line);
                    }
                    else
                    {
                        // 세그먼트 파일명 → 절대 경로
                        sb.AppendLine($"{schemeHost}/hls/ch{channelNumber}/{line}");
                    }
                }

                Response.Headers["Cache-Control"] = "no-store";
                return Content(sb.ToString(), "application/vnd.apple.mpegurl");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HLS 재생목록 제공 오류: {Channel}", channelNumber);
                return StatusCode(500);
            }
        }
    }
}