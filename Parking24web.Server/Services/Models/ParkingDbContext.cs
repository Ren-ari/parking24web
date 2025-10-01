using Microsoft.EntityFrameworkCore;

namespace Parking24web.Server.Models
{
    public class ParkingDbContext : DbContext
    {
        public ParkingDbContext(DbContextOptions<ParkingDbContext> options) : base(options)
        {
        }
        public DbSet<ParkingEvent> ParkingEvents { get; set; }
        public DbSet<ServiceRecord> ServiceRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ParkingEvent>(entity =>
            {
                entity.HasIndex(e => e.Timestamp);
                entity.HasIndex(e => e.CarNumber);
                entity.HasIndex(e => e.EventType);
            });

            modelBuilder.Entity<ServiceRecord>(entity =>
            {
                entity.HasIndex(e => e.VisitDate);
                entity.HasIndex(e => e.Status);
            });
        }
    }
}