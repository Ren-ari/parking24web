using System.Collections.Concurrent;

namespace Parking24web.Server.Services
{
    public class PLCService : IDisposable
    {
        private readonly LSIS_FENet _plc;
        private readonly object _lock = new object();

        // 연결 정보
        private string _ipAddress = string.Empty;
        private int _port = 0;
        private bool _isConnected = false;

        // 하트비트
        private Timer? _heartbeatTimer;
        private bool _heartbeatValue = false;
        private const int HEARTBEAT_INTERVAL = 1000; // 1초

        // 현장별 설정
        private SiteConfig? _currentSiteConfig;

        public PLCService()
        {
            _plc = new LSIS_FENet(0);
        }

        #region 연결 관리

        public bool IsConnected => _plc.IsOpen && _isConnected;

        public async Task<bool> ConnectAsync(string ip, int port)
        {
            try
            {
                _ipAddress = ip;
                _port = port;

                // 기존 연결 해제
                if (_plc.IsOpen)
                {
                    Disconnect();
                    await Task.Delay(1000);
                }

                // 새 연결 시도
                await Task.Run(() =>
                {
                    _plc.Connect(2323, ip, port); // 표준 LSIS 포트
                });

                await Task.Delay(500);
                _isConnected = _plc.IsOpen;

                if (_isConnected)
                {
                    StartHeartbeat();
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PLC 연결 실패: {ex.Message}");
                return false;
            }
        }

        public void Disconnect()
        {
            StopHeartbeat();

            lock (_lock)
            {
                _plc.DisConnect();
                _isConnected = false;
            }
        }

        #endregion

        #region 데이터 읽기/쓰기

        public ushort[] GetSensorData()
        {
            if (!IsConnected) return new ushort[256];

            // 연속 읽기 요청
            _plc.RegisterReadW("%CB0");
            // Sleep 제거 - LSIS_FENet이 내부적으로 처리

            return _plc.DataBuff;
        }

        public void WriteWord(string deviceType, int address, ushort value)
        {
            if (!IsConnected) return;

            string plcAddress = $"%{deviceType}W{address}";
            _plc.RegisterWriteW(plcAddress, value);
        }

        public void WriteBit(string deviceType, int address, int bitPosition, bool value)
        {
            if (!IsConnected) return;

            string plcAddress = $"%{deviceType}X{address}.{bitPosition:X}";
            _plc.RegisterWriteBit(plcAddress, value);
        }

        #endregion

        #region 하트비트

        private void StartHeartbeat()
        {
            _heartbeatTimer = new Timer(OnHeartbeat, null, 0, HEARTBEAT_INTERVAL);
        }

        private void OnHeartbeat(object? state)
        {
            try
            {
                if (!IsConnected) return;

                _heartbeatValue = !_heartbeatValue;
                WriteWord("C", 0, (ushort)(_heartbeatValue ? 1 : 0));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"하트비트 오류: {ex.Message}");
            }
        }

        private void StopHeartbeat()
        {
            _heartbeatTimer?.Dispose();
            _heartbeatTimer = null;
        }

        #endregion

        #region 인증

        public async Task<bool> AuthenticateAsync()
        {
            try
            {
                if (!IsConnected) return false;

                // C4 값 읽기 (인증 코드 확인)
                await Task.Delay(200);

                var data = GetSensorData();
                ushort authCode = data[4]; // C4 값

                return authCode == 62; // 유효한 인증 코드
            }
            catch (Exception ex)
            {
                Console.WriteLine($"인증 실패: {ex.Message}");
                return false;
            }
        }

        #endregion

        #region 현장별 설정

        public void LoadSiteConfig(SiteConfig config)
        {
            _currentSiteConfig = config;
        }

        public Dictionary<string, object> GetParsedSensorData()
        {
            if (_currentSiteConfig == null || !IsConnected)
                return new Dictionary<string, object>();

            var rawData = GetSensorData();
            var result = new Dictionary<string, object>();

            // 현장 설정에 따라 센서값 파싱
            var config = _currentSiteConfig.PlcConfig;
            int startAddress = GetAddressIndex(config.AddressType, config.StartNumber);

            foreach (var sensor in config.SensorOffsets)
            {
                int actualAddress = startAddress + sensor.Value;
                if (actualAddress < rawData.Length)
                {
                    ushort value = rawData[actualAddress];
                    result[sensor.Key] = value;
                }
            }

            return result;
        }

        private int GetAddressIndex(string addressType, int startNumber)
        {
            // C101 -> 배열 인덱스 101
            // P51 -> 배열 인덱스 51  
            return startNumber;
        }

        #endregion

        public void Dispose()
        {
            StopHeartbeat();
            Disconnect();
            _plc?.Dispose();
        }
    }

    // 현장별 설정 클래스
    public class SiteConfig
    {
        public string SiteName { get; set; } = string.Empty;
        public PlcConfig PlcConfig { get; set; } = new();
    }

    public class PlcConfig
    {
        public string Ip { get; set; } = string.Empty;
        public int Port { get; set; } = 2005;
        public string AddressType { get; set; } = "C";
        public int StartNumber { get; set; } = 101;
        public Dictionary<string, int> SensorOffsets { get; set; } = new();
        public Dictionary<string, int> ControlOffsets { get; set; } = new();
    }
}