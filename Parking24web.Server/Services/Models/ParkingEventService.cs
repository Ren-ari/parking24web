using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Parking24web.Server.Models;

namespace Parking24web.Server.Services
{
    public class ParkingEventService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly PLCService _plcService;
        private readonly ILogger<ParkingEventService> _logger;
        private ushort[] _previousData = new ushort[256];
        private bool _isInitialized = false;

        private readonly SiteConfiguration _siteConfig;

        public ParkingEventService(
            IServiceScopeFactory scopeFactory,
            PLCService plcService,
            ILogger<ParkingEventService> logger,
            IOptions<SiteConfiguration> siteConfig)
        {
            _scopeFactory = scopeFactory;
            _plcService = plcService;
            _logger = logger;
            _siteConfig = siteConfig.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("주차 이벤트 감시 서비스 시작");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (_plcService.IsConnected)
                    {
                        await DetectParkingEvents();
                    }

                    await Task.Delay(1000, stoppingToken); // 1초마다 체크
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "주차 이벤트 감시 중 오류");
                    await Task.Delay(5000, stoppingToken); // 오류 시 5초 대기
                }
            }
        }

        private async Task DetectParkingEvents()
        {
            var currentData = _plcService.GetSensorData();

            // 첫 실행 시에는 기준점만 설정하고 이벤트 생성 안함
            if (!_isInitialized)
            {
                Array.Copy(currentData, _previousData, Math.Min(currentData.Length, _previousData.Length));
                _isInitialized = true;
                return;
            }

            var events = new List<ParkingEvent>();

            // 설정 기반 차량 주소 범위 사용 (예: P211~P300, 90개 슬롯)
            var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 211;
            var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 300;
            var plcStartAddress = _siteConfig.PlcConfig?.StartAddress ?? 100;

            // PLC 주소를 배열 인덱스로 변환 (배열[0] = P100이므로)
            for (int plcAddress = vehicleStart; plcAddress <= vehicleEnd; plcAddress++)
            {
                int arrayIndex = plcAddress - plcStartAddress;
                if (arrayIndex < 0 || arrayIndex >= currentData.Length || arrayIndex >= _previousData.Length) continue;

                var prev = _previousData[arrayIndex];
                var curr = currentData[arrayIndex];

                if (prev == 0 && curr != 0)
                {
                    var slotNumber = plcAddress - vehicleStart + 1;
                    var floor = Math.Ceiling(slotNumber / 15.0);

                    events.Add(new ParkingEvent
                    {
                        Timestamp = DateTime.Now,
                        EventType = "입차",
                        CarNumber = curr.ToString().PadLeft(4, '0'),
                        SlotNumber = slotNumber,
                        Floor = (int)floor
                    });

                    _logger.LogInformation($"입차 감지: {curr.ToString().PadLeft(4, '0')} - {floor}단 {slotNumber}번");
                }
                else if (prev != 0 && curr == 0)
                {
                    // 출차 감지
                    var slotNumber = plcAddress - vehicleStart + 1;
                    var floor = Math.Ceiling(slotNumber / 15.0);

                    events.Add(new ParkingEvent
                    {
                        Timestamp = DateTime.Now,
                        EventType = "출차",
                        CarNumber = prev.ToString().PadLeft(4, '0'),
                        SlotNumber = slotNumber,
                        Floor = (int)floor
                    });

                    _logger.LogInformation($"출차 감지: {prev.ToString().PadLeft(4, '0')} - {floor}층 {slotNumber}번");
                }
            }

            // 이벤트가 있으면 DB에 저장
            bool saveSuccess = true;
            if (events.Count > 0)
            {
                saveSuccess = await SaveEventsToDatabase(events);
            }

            // DB 저장 성공했을 때만 현재 데이터를 이전 데이터로 복사
            if (saveSuccess)
            {
                Array.Copy(currentData, _previousData, Math.Min(currentData.Length, _previousData.Length));
            }
        }

        private async Task<bool> SaveEventsToDatabase(List<ParkingEvent> events)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ParkingDbContext>();

                int addedCount = 0;
                int duplicateCount = 0;

                foreach (var evt in events)
                {
                    // ✅ Idempotency Key 생성
                    // 형식: {차량번호}_{이벤트타입}_{분단위타임스탬프}_{슬롯번호}
                    var minuteTimestamp = new DateTime(
                        evt.Timestamp.Year,
                        evt.Timestamp.Month,
                        evt.Timestamp.Day,
                        evt.Timestamp.Hour,
                        evt.Timestamp.Minute,
                        0 // 초는 0으로 (1분 단위)
                    );

                    evt.IdempotencyKey =
                        $"{evt.CarNumber}_{evt.EventType}_" +
                        $"{minuteTimestamp:yyyyMMddHHmm}_{evt.SlotNumber}";

                    evt.CreatedAt = DateTime.Now;

                    // ✅ 중복 체크 (DB 레벨)
                    var exists = await context.ParkingEvents
                        .AnyAsync(e => e.IdempotencyKey == evt.IdempotencyKey);

                    if (!exists)
                    {
                        context.ParkingEvents.Add(evt);
                        addedCount++;
                    }
                    else
                    {
                        duplicateCount++;
                        _logger.LogDebug(
                            $"중복 이벤트 스킵: {evt.EventType} {evt.CarNumber} " +
                            $"(슬롯 {evt.SlotNumber}) [key: {evt.IdempotencyKey}]"
                        );
                    }
                }

                if (addedCount > 0)
                {
                    await context.SaveChangesAsync();
                    _logger.LogInformation(
                        $"DB 저장 완료 - 신규: {addedCount}건, 중복: {duplicateCount}건"
                    );
                }
                else if (duplicateCount > 0)
                {
                    _logger.LogDebug($"모두 중복: {duplicateCount}건");
                }

                return true; // 🔥 중복이어도 성공 처리
            }
            catch (DbUpdateException ex) when (
                ex.InnerException?.Message.Contains("UNIQUE constraint") == true)
            {
                // Race condition으로 인한 중복 (매우 드묾)
                _logger.LogWarning(
                    $"DB UNIQUE 제약 위반 (동시 삽입): {ex.InnerException.Message}"
                );
                return true; // 중복이므로 성공으로 처리
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DB 저장 실패");
                return false;
            }
        }
    }
}