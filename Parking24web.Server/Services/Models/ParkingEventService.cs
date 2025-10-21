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

            // C101~C180 영역 체크 (주차 슬롯 80개)
            // 설정 기반 차량 주소 범위 사용
            var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 101;
            var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 180;

            for (int i = vehicleStart; i <= vehicleEnd; i++)
            {
                if (i >= currentData.Length || i >= _previousData.Length) continue;

                var prev = _previousData[i];
                var curr = currentData[i];

                if (prev == 0 && curr != 0)
                {
                    var slotNumber = i - vehicleStart + 1;
                    var floor = Math.Ceiling(slotNumber / 2.0);

                    events.Add(new ParkingEvent
                    {
                        Timestamp = DateTime.Now,
                        EventType = "입차",
                        CarNumber = curr.ToString().PadLeft(4, '0'),
                        SlotNumber = slotNumber,
                        Floor = (int)floor
                    });

                    _logger.LogInformation($"입차 감지: {curr.ToString().PadLeft(4, '0')} - {floor}층 {slotNumber}번");
                }
                else if (prev != 0 && curr == 0)
                {
                    // 출차 감지
                    var slotNumber = i - 100;
                    var floor = Math.Ceiling(slotNumber / 2.0);

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

                context.ParkingEvents.AddRange(events);
                await context.SaveChangesAsync();

                _logger.LogInformation($"{events.Count}개 이벤트 DB 저장 완료");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DB 저장 실패 - 다음 루프에서 재시도");
                return false;
            }
        }
    }
}