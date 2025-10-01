using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking24web.Server.Models;

namespace Parking24web.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceRecordsController : ControllerBase
    {
        private readonly ParkingDbContext _context;
        private readonly ILogger<ServiceRecordsController> _logger;

        public ServiceRecordsController(ParkingDbContext context, ILogger<ServiceRecordsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 전체 A/S 기록 조회 (모든 권한)
        [HttpGet]
        public async Task<IActionResult> GetAllRecords()
        {
            var records = await _context.ServiceRecords
                .OrderByDescending(r => r.VisitDate)
                .ToListAsync();

            return Ok(records);
        }

        // A/S 기록 추가 (admin/service만)
        [HttpPost]
        public async Task<IActionResult> CreateRecord([FromBody] ServiceRecord record)
        {
            record.CreatedAt = DateTime.Now;
            _context.ServiceRecords.Add(record);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"A/S 기록 추가: {record.TechnicianName} - {record.WorkDescription}");
            return Ok(record);
        }

        // A/S 기록 수정 (admin/service만)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRecord(int id, [FromBody] ServiceRecord record)
        {
            var existing = await _context.ServiceRecords.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.VisitDate = record.VisitDate;
            existing.TechnicianName = record.TechnicianName;
            existing.WorkDescription = record.WorkDescription;
            existing.Status = record.Status;
            existing.Notes = record.Notes;

            await _context.SaveChangesAsync();

            _logger.LogInformation($"A/S 기록 수정: ID {id}");
            return Ok(existing);
        }

        // A/S 기록 삭제 (admin만)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecord(int id)
        {
            var record = await _context.ServiceRecords.FindAsync(id);
            if (record == null)
                return NotFound();

            _context.ServiceRecords.Remove(record);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"A/S 기록 삭제: ID {id}");
            return Ok();
        }
    }
}