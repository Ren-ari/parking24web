using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Parking24web.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceRecordsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ServiceRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    VisitDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TechnicianName = table.Column<string>(type: "TEXT", nullable: false),
                    WorkDescription = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Notes = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_Status",
                table: "ServiceRecords",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRecords_VisitDate",
                table: "ServiceRecords",
                column: "VisitDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceRecords");
        }
    }
}
