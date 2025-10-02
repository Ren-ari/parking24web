namespace Parking24web.Server.Models
{
    /// <summary>
    /// CCTV 연결 요청 정보
    /// </summary>
    public class CCTVConnectRequest
    {
        public string IpAddress { get; set; } = string.Empty;
        public ushort Port { get; set; }           // HTTP(ISAPI) 포트 (보통 8080)
        public ushort RtspPort { get; set; }       // RTSP 포트 (보통 8888)
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// CCTV 연결 결과
    /// </summary>
    public class CCTVConnectResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// CCTV 상태 정보
    /// </summary>
    public class CCTVStatus
    {
        public bool IsConnected { get; set; }
        public string StatusMessage { get; set; } = string.Empty;
        public int CurrentChannel { get; set; }
        public DateTime LastUpdate { get; set; }
        public bool IsStreaming { get; set; }
        public string ConnectionInfo { get; set; } = string.Empty;
    }
}