using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking24web.Server.Models;
using Parking24web.Server.Services;
using Microsoft.Extensions.Options;

namespace Parking24web.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParkingEventsController : ControllerBase
    {
        private readonly ParkingDbContext _context;
        private readonly PLCService _plcService;
        private readonly ILogger<ParkingEventsController> _logger;
        private readonly SiteConfiguration _siteConfig;

        public ParkingEventsController(
            ParkingDbContext context,
            PLCService plcService,
            ILogger<ParkingEventsController> logger,
            IOptions<SiteConfiguration> siteConfig)
        {
            _context = context;
            _plcService = plcService;
            _logger = logger;
            _siteConfig = siteConfig.Value;
        }

        // 최근 이벤트 조회 (최근 3일)
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentEvents()
        {
            var threeDaysAgo = DateTime.Now.AddDays(-3);
            var events = await _context.ParkingEvents
                .Where(e => e.Timestamp >= threeDaysAgo)
                .OrderByDescending(e => e.Timestamp)
                .Take(100)
                .ToListAsync();

            return Ok(events);
        }

        // 현재 주차중인 차량 조회
        [HttpGet("parked")]
        public async Task<IActionResult> GetParkedVehicles()
        {
            var parkedVehicles = new List<object>();

            _logger.LogInformation($"GetParkedVehicles 호출 - PLC 연결: {_plcService.IsConnected}");

            if (_plcService.IsConnected)
            {
                var sensorData = _plcService.GetSensorData();

                // 설정 기반 차량 주소 범위 사용
                var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 211;
                var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 300;
                var plcStartAddress = _siteConfig.PlcConfig?.StartAddress ?? 100;

                // PLC 주소를 배열 인덱스로 변환 (배열[0] = P100이므로)
                for (int plcAddress = vehicleStart; plcAddress <= vehicleEnd; plcAddress++)
                {
                    int arrayIndex = plcAddress - plcStartAddress;
                    if (arrayIndex < 0 || arrayIndex >= sensorData.Length || sensorData[arrayIndex] == 0) continue;

                    var slotNumber = plcAddress - vehicleStart + 1;
                    // 1~15번: 1단, 16~30번: 2단, 31~45번: 3단, 46~60번: 4단, 61~75번: 5단, 76~90번: 6단
                    var floor = Math.Ceiling(slotNumber / 15.0);

                    parkedVehicles.Add(new
                    {
                        CarNumber = sensorData[arrayIndex].ToString().PadLeft(4, '0'),
                        SlotNumber = slotNumber,
                        Floor = (int)floor,
                        Status = "주차중"
                    });
                }
            }

            return Ok(parkedVehicles);
        }

        // 출차된 차량 조회 (최근 50개)
        [HttpGet("exited")]
        public async Task<IActionResult> GetExitedVehicles([FromQuery] int limit = 50)
        {
            // limit 범위 제한 (1~200)
            limit = Math.Max(1, Math.Min(200, limit));

            var exitedVehicles = await _context.ParkingEvents
                .Where(e => e.EventType == "출차")
                .OrderByDescending(e => e.Timestamp)
                .Take(limit)
                .ToListAsync();

            return Ok(exitedVehicles);
        }

        // 통계 정보 조회
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var today = DateTime.Today;
            var thisMonth = new DateTime(today.Year, today.Month, 1);

            var todayIn = await _context.ParkingEvents
                .CountAsync(e => e.EventType == "입차" && e.Timestamp >= today);

            var todayOut = await _context.ParkingEvents
                .CountAsync(e => e.EventType == "출차" && e.Timestamp >= today);

            var monthlyIn = await _context.ParkingEvents
                .CountAsync(e => e.EventType == "입차" && e.Timestamp >= thisMonth);

            var monthlyOut = await _context.ParkingEvents
                .CountAsync(e => e.EventType == "출차" && e.Timestamp >= thisMonth);

            // 현재 주차 대수
            var currentTotal = 0;
            if (_plcService.IsConnected)
            {
                var sensorData = _plcService.GetSensorData();
                var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 211;
                var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 300;
                var plcStartAddress = _siteConfig.PlcConfig?.StartAddress ?? 100;

                // PLC 주소를 배열 인덱스로 변환
                for (int plcAddress = vehicleStart; plcAddress <= vehicleEnd; plcAddress++)
                {
                    int arrayIndex = plcAddress - plcStartAddress;
                    if (arrayIndex >= 0 && arrayIndex < sensorData.Length && sensorData[arrayIndex] != 0)
                        currentTotal++;
                }
            }

            return Ok(new
            {
                todayIn,
                todayOut,
                monthlyIn,
                monthlyOut,
                currentTotal
            });
        }

        // 차량 검색
        [HttpGet("search/{carNumber}")]
        public async Task<IActionResult> SearchVehicle(string carNumber)
        {
            var allEvents = new List<object>();

            // 1. 현재 주차중 확인
            if (_plcService.IsConnected)
            {
                var sensorData = _plcService.GetSensorData();
                var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 211;
                var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 300;
                var plcStartAddress = _siteConfig.PlcConfig?.StartAddress ?? 100;

                // PLC 주소를 배열 인덱스로 변환
                for (int plcAddress = vehicleStart; plcAddress <= vehicleEnd; plcAddress++)
                {
                    int arrayIndex = plcAddress - plcStartAddress;
                    if (arrayIndex < 0 || arrayIndex >= sensorData.Length || sensorData[arrayIndex] == 0) continue;

                    var vehicleNumber = sensorData[arrayIndex].ToString().PadLeft(4, '0');
                    if (vehicleNumber.Contains(carNumber))
                    {
                        var slotNumber = plcAddress - vehicleStart + 1;
                        // 1~15번: 1단, 16~30번: 2단, 31~45번: 3단, 46~60번: 4단, 61~75번: 5단, 76~90번: 6단
                        var floor = Math.Ceiling(slotNumber / 15.0);

                        allEvents.Add(new
                        {
                            eventType = "주차중",
                            carNumber = vehicleNumber,
                            slotNumber,
                            timestamp = DateTime.Now
                        });
                    }
                }
            }

            // 2. 과거 입차/출차 기록 검색 (6개월)
            var sixMonthsAgo = DateTime.Now.AddMonths(-6);
            var recentEvents = await _context.ParkingEvents
                .Where(e => e.CarNumber.Contains(carNumber) && e.Timestamp >= sixMonthsAgo)
                .OrderByDescending(e => e.Timestamp)
                .ToListAsync();

            if (recentEvents.Any())
            {
                allEvents.AddRange(recentEvents.Select(e => new
                {
                    eventType = e.EventType,
                    carNumber = e.CarNumber,
                    slotNumber = e.SlotNumber,
                    timestamp = e.Timestamp
                }));
            }

            // 3. 결과 반환
            if (allEvents.Count > 0)
            {
                return Ok(new
                {
                    found = true,
                    events = allEvents
                });
            }

            return Ok(new
            {
                found = false,
                message = "해당 차량을 찾을 수 없습니다."
            });
        }
    }
}