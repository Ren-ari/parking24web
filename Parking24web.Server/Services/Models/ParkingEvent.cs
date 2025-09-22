using System.ComponentModel.DataAnnotations;

namespace Parking24web.Server.Models
{
    public class ParkingEvent
    {
        public int Id { get; set; }

        [Required]
        public DateTime Timestamp { get; set; }

        [Required]
        [MaxLength(10)]
        public string EventType { get; set; } = string.Empty; // "입차" or "출차"

        [Required]
        [MaxLength(20)]
        public string CarNumber { get; set; } = string.Empty;

        public int SlotNumber { get; set; }

        public int Floor { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}