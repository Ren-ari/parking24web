

namespace Parking24web.Server.Models
{
    /// <summary>
    /// PLC 명령 요청
    /// </summary>
    public class CommandRequest
    {
        /// <summary>
        /// 명령 이름 (예: liftUp, doorClose)
        /// </summary>
        public string CommandName { get; set; } = string.Empty;

        /// <summary>
        /// 명령 값 (0: OFF, 1: ON)
        /// </summary>
        public int Value { get; set; }

        /// <summary>
        /// 멱등성 키 (클라이언트 생성)
        /// </summary>
        public string IdempotencyKey { get; set; } = string.Empty;

        /// <summary>
        /// 명령 고유 ID (클라이언트 생성, 응답 매칭용)
        /// </summary>
        public string CommandId { get; set; } = string.Empty;

        /// <summary>
        /// 리소스 키 (lift, door, turn 등)
        /// </summary>
        public string ResourceKey { get; set; } = string.Empty;

        /// <summary>
        /// 즉시 실행 플래그 (0값 등 긴급 명령용)
        /// </summary>
        public bool Immediate { get; set; } = false;
    }

    /// <summary>
    /// PLC 명령 응답
    /// </summary>
    public class CommandResult
    {
        /// <summary>
        /// 성공 여부
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// 응답 메시지
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// 서버 타임스탬프 (Unix milliseconds)
        /// </summary>
        public long Timestamp { get; set; }

        /// <summary>
        /// 멱등성 키 (요청과 동일)
        /// </summary>
        public string IdempotencyKey { get; set; } = string.Empty;

        /// <summary>
        /// 명령 고유 ID (요청과 동일)
        /// </summary>
        public string CommandId { get; set; } = string.Empty;

        /// <summary>
        /// 리소스별 증가 시퀀스 번호
        /// </summary>
        public long Sequence { get; set; }

        /// <summary>
        /// 리소스 키
        /// </summary>
        public string ResourceKey { get; set; } = string.Empty;

        /// <summary>
        /// 처리 시간 (밀리초)
        /// </summary>
        public long ElapsedMs { get; set; }
    }

    /// <summary>
    /// 리소스별 정보 (내부 관리용)
    /// </summary>
    public class ResourceInfo
    {
        /// <summary>
        /// 리소스 키
        /// </summary>
        public string ResourceKey { get; set; } = string.Empty;

        /// <summary>
        /// 현재 시퀀스 번호
        /// </summary>
        public long Sequence { get; set; } = 0;

        /// <summary>
        /// 마지막 명령 시간
        /// </summary>
        public DateTime LastCommandTime { get; set; } = DateTime.MinValue;

        /// <summary>
        /// 마지막 명령 ID
        /// </summary>
        public string LastCommandId { get; set; } = string.Empty;
    }
}