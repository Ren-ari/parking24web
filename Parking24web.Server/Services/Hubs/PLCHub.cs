using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Parking24web.Server.Services;

namespace Parking24web.Server.Hubs
{
    public class PLCHub : Hub
    {
        private readonly PLCService _plcService;
        private readonly ILogger<PLCHub> _logger;
        private readonly IHubContext<PLCHub> _hubContext;
        private readonly SiteConfiguration _siteConfig;

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

        // Config에서 PLC IP/Port 가져와서 연결하는 메서드
        public async Task<bool> ConnectToPLCFromConfig()
        {
            try
            {
                if (_siteConfig.PlcConfig == null)
                {
                    await Clients.Caller.SendAsync("Error", "PLC 설정이 없습니다");
                    return false;
                }

                var ip = _siteConfig.PlcConfig.Ip;
                var port = _siteConfig.PlcConfig.Port;

                _logger.LogInformation($"Config 기반 PLC 연결: {ip}:{port}");
                return await ConnectToPLC(ip, port);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Config 기반 PLC 연결 중 오류");
                await Clients.Caller.SendAsync("Error", $"Config 연결 실패: {ex.Message}");
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

        // 현재 로드된 설정 정보 반환
        public async Task GetCurrentSiteConfiguration()
        {
            try
            {
                await Clients.Caller.SendAsync("CurrentSiteConfiguration", new
                {
                    siteName = _siteConfig.SiteInfo?.Name ?? "Unknown",
                    unitNumber = _siteConfig.SiteInfo?.UnitNumber ?? "Unknown",
                    location = _siteConfig.SiteInfo?.Location ?? "",
                    plcIp = _siteConfig.PlcConfig?.Ip ?? "",
                    plcPort = _siteConfig.PlcConfig?.Port ?? 0,
                    commandCount = _siteConfig.ControlCommands?.Count ?? 0,
                    dataAddressCount = _siteConfig.DataAddresses?.Count ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "현장 설정 정보 전송 중 오류");
                await Clients.Caller.SendAsync("Error", $"설정 정보 오류: {ex.Message}");
            }
        }

        private int GetCommandAddress(string commandName)
        {
            if (_siteConfig.ControlCommands == null)
            {
                _logger.LogWarning($"제어 명령 설정이 로드되지 않았습니다: {commandName}");
                return -1;
            }

            if (_siteConfig.ControlCommands.TryGetValue(commandName, out int address))
            {
                _logger.LogDebug($"명령 주소 조회: {commandName} = P{address}");
                return address;
            }

            _logger.LogWarning($"명령 주소를 찾을 수 없습니다: {commandName}");
            return -1;
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
                _logger.LogDebug($"시스템 주소 조회: {addressName} = P{address}");
                return address;
            }

            _logger.LogWarning($"시스템 주소를 찾을 수 없습니다: {addressName}");
            return -1;
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

        // Config 기반 명령 전송
        public async Task SendConfigCommand(string commandName, int value = 1)
        {
            try
            {
                int address = GetCommandAddress(commandName);
                if (address == -1)
                {
                    await Clients.Caller.SendAsync("Error", $"명령을 찾을 수 없습니다: {commandName}");
                    return;
                }

                await SendPLCCommand(new PLCCommandRequest
                {
                    CommandType = "writeword",
                    DeviceType = "P",
                    Address = address,
                    Value = value
                });

                _logger.LogInformation($"Config 명령 전송: {commandName} (P{address}) = {value}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Config 명령 전송 중 오류: {commandName}");
                await Clients.Caller.SendAsync("Error", $"명령 전송 실패: {ex.Message}");
            }
        }

        #endregion

        #region Config 기반 수동 제어 명령들

        // 승강 제어
        public async Task LiftUp(int value = 1)
        {
            await SendConfigCommand("liftUp", value);
        }

        public async Task LiftDown(int value = 1)
        {
            await SendConfigCommand("liftDown", value);
        }

        // 횡행 제어
        public async Task MoveLeft(int value = 1)
        {
            await SendConfigCommand("moveLeft", value);
        }

        public async Task MoveRight(int value = 1)
        {
            await SendConfigCommand("moveRight", value);
        }

        // 턴테이블 제어
        public async Task TurnLeft(int value = 1)
        {
            await SendConfigCommand("turnLeft", value);
        }

        public async Task TurnRight(int value = 1)
        {
            await SendConfigCommand("turnRight", value);
        }

        // 락킹 제어
        public async Task LockingOn(int value = 1)
        {
            await SendConfigCommand("lockingOn", value);
        }

        public async Task LockingOff(int value = 1)
        {
            await SendConfigCommand("lockingOff", value);
        }

        // 도어 제어
        public async Task DoorOpen(int value = 1)
        {
            await SendConfigCommand("doorOpen", value);
        }

        public async Task DoorClose(int value = 1)
        {
            await SendConfigCommand("doorClose", value);
        }

        // 시스템 제어
        public async Task ErrorReset(int value = 1)
        {
            await SendConfigCommand("errorReset", value);
        }

        public async Task RemoteControl(int value = 1)
        {
            await SendConfigCommand("remoteControl", value);
        }

        public async Task HomeReturn(int value = 1)
        {
            await SendConfigCommand("homeReturn", value);
        }

        public async Task PaletteChange(int value = 1)
        {
            await SendConfigCommand("paletteChange", value);
        }

        // 비상 정지 (시스템 주소 사용)
        public async Task EmergencyStop(int value = 1)
        {
            try
            {
                int address = GetSystemAddress("EmergencyStop");
                if (address == -1)
                {
                    await Clients.Caller.SendAsync("Error", "비상정지 주소가 설정되지 않았습니다");
                    return;
                }

                await SendPLCCommand(new PLCCommandRequest
                {
                    CommandType = "writeword",
                    DeviceType = "P",
                    Address = address,
                    Value = value
                });

                _logger.LogInformation($"비상정지 명령 전송: P{address} = {value}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "비상정지 명령 중 오류");
                await Clients.Caller.SendAsync("Error", $"비상정지 실패: {ex.Message}");
            }
        }

        #endregion

        #region 백워드 호환성 (기존 명령들)

        // 기존 코드와의 호환성을 위해 유지
        [Obsolete("RemoteControl 사용을 권장합니다")]
        public async Task OperationMode(int value = 1)
        {
            await RemoteControl(value);
        }

        [Obsolete("HomeReturn 사용을 권장합니다")]
        public async Task Recovery(int value = 1)
        {
            await HomeReturn(value);
        }

        [Obsolete("TurnLeft 사용을 권장합니다")]
        public async Task TurnTableLeft(int value = 1)
        {
            await TurnLeft(value);
        }

        [Obsolete("TurnRight 사용을 권장합니다")]
        public async Task TurnTableRight(int value = 1)
        {
            await TurnRight(value);
        }

        [Obsolete("Config에서 정의되지 않은 명령입니다")]
        public async Task TurnTableUp(int value = 1)
        {
            await Clients.Caller.SendAsync("Error", "TurnTableUp 명령은 더 이상 지원되지 않습니다");
        }

        [Obsolete("Config에서 정의되지 않은 명령입니다")]
        public async Task TurnTableDown(int value = 1)
        {
            await Clients.Caller.SendAsync("Error", "TurnTableDown 명령은 더 이상 지원되지 않습니다");
        }

        [Obsolete("LockingOn/LockingOff 사용을 권장합니다")]
        public async Task LeftLiftLock(int value = 1)
        {
            await LockingOn(value);
        }

        [Obsolete("LockingOn/LockingOff 사용을 권장합니다")]
        public async Task LeftLiftUnlock(int value = 1)
        {
            await LockingOff(value);
        }

        [Obsolete("LockingOn/LockingOff 사용을 권장합니다")]
        public async Task RightLiftLock(int value = 1)
        {
            await LockingOn(value);
        }

        [Obsolete("LockingOn/LockingOff 사용을 권장합니다")]
        public async Task RightLiftUnlock(int value = 1)
        {
            await LockingOff(value);
        }

        #endregion

        #region SignalR 이벤트

        private static Timer? _broadcastTimer;
        private static bool _isMonitoring = false;

        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("PLCConnectionChanged", _plcService.IsConnected);
            _logger.LogInformation($"클라이언트 연결: {Context.ConnectionId}");

            // 현재 로드된 설정 정보 전송
            await GetCurrentSiteConfiguration();

            // 첫 클라이언트 연결시에만 타이머 시작
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

    // PLC 명령 요청 클래스
    public class PLCCommandRequest
    {
        public string CommandType { get; set; } = string.Empty; // writeword, writebit
        public string DeviceType { get; set; } = "P"; // C, P, D 등
        public int Address { get; set; }
        public int BitPosition { get; set; } = 0; // 비트 명령용
        public int Value { get; set; }
    }
}