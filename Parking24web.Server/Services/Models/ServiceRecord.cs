namespace Parking24web.Server.Models
{
    public class ServiceRecord
    {
        public int Id { get; set; }
        public DateTime VisitDate { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string WorkDescription { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }
}