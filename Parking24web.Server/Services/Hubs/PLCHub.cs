using Microsoft.AspNetCore.SignalR;
using Parking24web.Server.Services;

namespace Parking24web.Server.Hubs
{
    public class PLCHub : Hub
    {
        private readonly PLCService _plcService;
        private readonly ILogger<PLCHub> _logger;

        public PLCHub(PLCService plcService, ILogger<PLCHub> logger)
        {
            _plcService = plcService;
            _logger = logger;
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

        #region PLC 제어

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

        // 수동 제어 명령들
        public async Task LiftUp(int value = 1)
        {
            await SendPLCCommand(new PLCCommandRequest
            {
                CommandType = "writeword",
                DeviceType = "C",
                Address = 7, // 상승 명령 주소
                Value = value
            });
        }

        public async Task LiftDown(int value = 1)
        {
            await SendPLCCommand(new PLCCommandRequest
            {
                CommandType = "writeword",
                DeviceType = "C",
                Address = 8, // 하강 명령 주소
                Value = value
            });
        }

        public async Task MoveLeft(int value = 1)
        {
            await SendPLCCommand(new PLCCommandRequest
            {
                CommandType = "writeword",
                DeviceType = "C",
                Address = 9, // 좌행 명령 주소
                Value = value
            });
        }

        public async Task MoveRight(int value = 1)
        {
            await SendPLCCommand(new PLCCommandRequest
            {
                CommandType = "writeword",
                DeviceType = "C",
                Address = 10, // 우행 명령 주소
                Value = value
            });
        }

        public async Task EmergencyStop()
        {
            await SendPLCCommand(new PLCCommandRequest
            {
                CommandType = "writeword",
                DeviceType = "C",
                Address = 99, // 비상정지 주소 (예시)
                Value = 1
            });
        }

        #endregion

        #region 현장 설정

        public async Task LoadSiteConfig(SiteConfig config)
        {
            try
            {
                _plcService.LoadSiteConfig(config);
                await Clients.All.SendAsync("SiteConfigLoaded", config);
                _logger.LogInformation($"현장 설정 로드: {config.SiteName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "현장 설정 로드 중 오류");
                await Clients.Caller.SendAsync("Error", $"설정 로드 실패: {ex.Message}");
            }
        }

        #endregion

        #region SignalR 이벤트

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("PLCConnectionChanged", _plcService.IsConnected);
            _logger.LogInformation($"클라이언트 연결: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"클라이언트 연결 해제: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }

        #endregion
    }

    // PLC 명령 요청 클래스
    public class PLCCommandRequest
    {
        public string CommandType { get; set; } = string.Empty; // writeword, writebit
        public string DeviceType { get; set; } = "C"; // C, P, D 등
        public int Address { get; set; }
        public int BitPosition { get; set; } = 0; // 비트 명령용
        public int Value { get; set; }
    }
}