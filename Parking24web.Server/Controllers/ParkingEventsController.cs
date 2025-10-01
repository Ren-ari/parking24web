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

        // 최근 이벤트 조회 (오늘 하루치)
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentEvents()
        {
            var today = DateTime.Today;
            var events = await _context.ParkingEvents
                .Where(e => e.Timestamp >= today)
                .OrderByDescending(e => e.Timestamp)
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
                var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 101;
                var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 180;

                for (int i = vehicleStart; i <= vehicleEnd; i++)
                {
                    if (i < sensorData.Length && sensorData[i] != 0)
                    {
                        var slotNumber = i - vehicleStart + 1;
                        var floor = Math.Ceiling(slotNumber / 2.0);

                        parkedVehicles.Add(new
                        {
                            CarNumber = sensorData[i].ToString().PadLeft(4, '0'),
                            SlotNumber = slotNumber,
                            Floor = (int)floor,
                            Status = "주차중"
                        });
                    }
                }
            }

            return Ok(parkedVehicles);
        }

        // 출차된 차량 조회 (최근 50개)
        [HttpGet("exited")]
        public async Task<IActionResult> GetExitedVehicles([FromQuery] int limit = 50)
        {
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
                var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 101;
                var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 180;
                for (int i = vehicleStart; i <= vehicleEnd; i++)
                {
                    if (i < sensorData.Length && sensorData[i] != 0)
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
                var vehicleStart = _siteConfig.VehicleStorage?.StartAddress ?? 101;
                var vehicleEnd = _siteConfig.VehicleStorage?.EndAddress ?? 180;

                for (int i = vehicleStart; i <= vehicleEnd; i++)
                {
                    if (i < sensorData.Length && sensorData[i] != 0)
                    {
                        var vehicleNumber = sensorData[i].ToString().PadLeft(4, '0');
                        if (vehicleNumber.Contains(carNumber))
                        {
                            var slotNumber = i - vehicleStart + 1;
                            var floor = Math.Ceiling(slotNumber / 2.0);

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