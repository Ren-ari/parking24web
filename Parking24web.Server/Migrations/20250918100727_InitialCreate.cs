using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Parking24web.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ParkingEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EventType = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    CarNumber = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SlotNumber = table.Column<int>(type: "INTEGER", nullable: false),
                    Floor = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingEvents_CarNumber",
                table: "ParkingEvents",
                column: "CarNumber");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingEvents_EventType",
                table: "ParkingEvents",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingEvents_Timestamp",
                table: "ParkingEvents",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParkingEvents");
        }
    }
}
