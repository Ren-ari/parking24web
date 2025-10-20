using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking24web.Server.Models;

namespace Parking24web.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ParkingDbContext _context;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            ParkingDbContext context,
            ILogger<AnalyticsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 월별 입출차 통계 (최근 12개월)
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyAnalytics()
        {
            var twelveMonthsAgo = DateTime.Now.AddMonths(-12);

            var monthlyData = await _context.ParkingEvents
                .Where(e => e.Timestamp >= twelveMonthsAgo)
                .GroupBy(e => new { e.Timestamp.Year, e.Timestamp.Month, e.EventType })
                .Select(g => new {
                    year = g.Key.Year,
                    month = g.Key.Month,
                    eventType = g.Key.EventType,
                    count = g.Count()
                })
                .OrderBy(x => x.year).ThenBy(x => x.month)
                .ToListAsync();

            return Ok(monthlyData);
        }

        // 요일별 입출차 통계 (최근 3개월)
        [HttpGet("weekly")]
        public async Task<IActionResult> GetWeeklyAnalytics()
        {
            var threeMonthsAgo = DateTime.Now.AddMonths(-3);

            var weeklyData = await _context.ParkingEvents
                .Where(e => e.Timestamp >= threeMonthsAgo)
                .GroupBy(e => new { DayOfWeek = (int)e.Timestamp.DayOfWeek, e.EventType })
                .Select(g => new {
                    dayOfWeek = g.Key.DayOfWeek,
                    eventType = g.Key.EventType,
                    count = g.Count()
                })
                .OrderBy(x => x.dayOfWeek)
                .ToListAsync();

            return Ok(weeklyData);
        }

        // 시간대별 입출차 통계 (최근 1개월)
        [HttpGet("hourly")]
        public async Task<IActionResult> GetHourlyAnalytics()
        {
            var oneMonthAgo = DateTime.Now.AddMonths(-1);

            var hourlyData = await _context.ParkingEvents
                .Where(e => e.Timestamp >= oneMonthAgo)
                .GroupBy(e => new { Hour = e.Timestamp.Hour, e.EventType })
                .Select(g => new {
                    hour = g.Key.Hour,
                    eventType = g.Key.EventType,
                    count = g.Count()
                })
                .OrderBy(x => x.hour)
                .ToListAsync();

            return Ok(hourlyData);
        }

        // 차판 이용 빈도 TOP 10 (최근 3개월)
        [HttpGet("topslots")]
        public async Task<IActionResult> GetTopSlots()
        {
            var threeMonthsAgo = DateTime.Now.AddMonths(-3);

            var topSlots = await _context.ParkingEvents
                .Where(e => e.Timestamp >= threeMonthsAgo && e.EventType == "입차")
                .GroupBy(e => e.SlotNumber)
                .Select(g => new {
                    slotNumber = g.Key,
                    count = g.Count()
                })
                .OrderByDescending(x => x.count)
                .Take(10)
                .ToListAsync();

            return Ok(topSlots);
        }

    }
}