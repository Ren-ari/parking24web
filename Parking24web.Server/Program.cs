using Microsoft.EntityFrameworkCore;
using Parking24web.Server.Hubs;
using Parking24web.Server.Models;
using Parking24web.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// 환경변수에서 현장명 가져오기
var siteName = args.Length > 0 ? args[0] : "Sokcho2";
Console.WriteLine($"현장 설정: {siteName}");

// 사이트별 설정 파일 로드
var siteConfigFile = $"appsettings.{siteName}.json";
if (File.Exists(siteConfigFile))
{
    builder.Configuration.AddJsonFile(siteConfigFile, optional: false, reloadOnChange: true);
    Console.WriteLine($"사이트 설정 파일 로드됨: {siteConfigFile}");
}
else
{
    Console.WriteLine($"경고: 사이트 설정 파일을 찾을 수 없습니다: {siteConfigFile}");
    Console.WriteLine("기본 설정을 사용합니다.");
}

var urls = builder.Configuration["Urls"] ?? "http://0.0.0.0:5123";
builder.WebHost.UseUrls(urls);

// 기존 서비스들
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllersWithViews();

// 실행 파일 위치 기준으로 DB 경로 설정
var appDirectory = AppContext.BaseDirectory;
var dbPath = Path.Combine(appDirectory, "Data", "parking.db");
var dbDirectory = Path.GetDirectoryName(dbPath);

// Data 폴더 없으면 생성
if (!Directory.Exists(dbDirectory))
{
    Directory.CreateDirectory(dbDirectory);
}

// SQLite 데이터베이스 연결
builder.Services.AddDbContext<ParkingDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// SignalR 서비스 추가
builder.Services.AddSignalR();

// PLC 서비스 싱글톤으로 등록
builder.Services.AddSingleton<PLCService>();

// CCTV 서비스 싱글톤으로 등록
builder.Services.AddSingleton<CCTVService>();

// 백그라운드 서비스 등록
builder.Services.AddHostedService<ParkingEventService>();

// Configuration을 강타입으로 바인딩
builder.Services.Configure<SiteConfiguration>(
    builder.Configuration.GetSection("SiteConfig")
);

// CORS 설정 (개발/프로덕션 분리)
builder.Services.AddCors(options =>
{
    // 프로덕션용 - 독립실행파일에서 사용
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    // 개발용 - React 개발 서버와 통신
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("https://localhost:5173", "http://localhost:5173",
                          "https://0.0.0.0:5173", "http://0.0.0.0:5173") // 외부 접속용 추가
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // SignalR용 필수
    });
});

var app = builder.Build();

// 데이터베이스 자동 생성
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ParkingDbContext>();
    context.Database.EnsureCreated();

    // ✅ IdempotencyKey 컬럼 추가 (기존 DB 대응)
    var connection = context.Database.GetDbConnection();
    connection.Open();

    using var command = connection.CreateCommand();

    // 1. 컬럼 존재 확인
    command.CommandText = @"
        SELECT COUNT(*) 
        FROM pragma_table_info('ParkingEvents') 
        WHERE name='IdempotencyKey'
    ";
    var columnExists = (long)command.ExecuteScalar()! > 0;

    if (!columnExists)
    {
        Console.WriteLine("IdempotencyKey 컬럼 추가 중...");

        // 2. 컬럼 추가
        command.CommandText = @"
            ALTER TABLE ParkingEvents 
            ADD COLUMN IdempotencyKey TEXT NOT NULL DEFAULT '';
        ";
        command.ExecuteNonQuery();

        // 3. 기존 데이터에 키 생성
        command.CommandText = @"
            UPDATE ParkingEvents 
            SET IdempotencyKey = 
                CarNumber || '_' || 
                EventType || '_' || 
                strftime('%Y%m%d%H%M', Timestamp) || '_' || 
                SlotNumber
            WHERE IdempotencyKey = '';
        ";
        var updated = command.ExecuteNonQuery();
        Console.WriteLine($"{updated}개 기존 레코드에 IdempotencyKey 생성 완료");

        // 4. UNIQUE 인덱스 생성
        command.CommandText = @"
            CREATE UNIQUE INDEX IF NOT EXISTS 
            IX_ParkingEvents_IdempotencyKey 
            ON ParkingEvents(IdempotencyKey);
        ";
        command.ExecuteNonQuery();

        Console.WriteLine("IdempotencyKey UNIQUE 인덱스 생성 완료");
    }
    else
    {
        Console.WriteLine("IdempotencyKey 컬럼이 이미 존재합니다");
    }

    // ServiceRecords 테이블 수동 생성 (기존 DB 호환)
    command.CommandText = @"
        CREATE TABLE IF NOT EXISTS ServiceRecords (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            VisitDate TEXT NOT NULL,
            TechnicianName TEXT NOT NULL,
            WorkDescription TEXT NOT NULL,
            Status TEXT NOT NULL,
            Notes TEXT,
            CreatedAt TEXT NOT NULL,
            CreatedBy TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IX_ServiceRecords_VisitDate ON ServiceRecords (VisitDate);
        CREATE INDEX IF NOT EXISTS IX_ServiceRecords_Status ON ServiceRecords (Status);
    ";
    command.ExecuteNonQuery();
}
// 시작시 사이트 설정 검증
try
{
    var siteConfig = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<SiteConfiguration>>().Value;
    var logger = app.Services.GetRequiredService<ILogger<Program>>();

    logger.LogInformation($"현장 정보: {siteConfig.SiteInfo?.Name} {siteConfig.SiteInfo?.UnitNumber}");
    logger.LogInformation($"PLC 설정: {siteConfig.PlcConfig?.Ip}:{siteConfig.PlcConfig?.Port}");
    logger.LogInformation($"제어 명령 개수: {siteConfig.ControlCommands?.Count ?? 0}개");

    // 필수 설정 검증
    if (siteConfig.SiteInfo == null || string.IsNullOrEmpty(siteConfig.SiteInfo.Name))
    {
        logger.LogWarning("사이트 정보가 올바르게 설정되지 않았습니다.");
    }

    if (siteConfig.ControlCommands == null || siteConfig.ControlCommands.Count == 0)
    {
        logger.LogWarning("제어 명령이 설정되지 않았습니다.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"설정 검증 중 오류: {ex.Message}");
}

// 환경별 설정
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // 개발환경에서는 React 개발서버용 CORS
    app.UseCors("AllowReactApp");
}
else
{
    // 프로덕션 환경 (독립실행파일)
    app.UseExceptionHandler("/Error");
    app.UseHsts();
    // 프로덕션에서는 모든 origin 허용
    app.UseCors("AllowAll");
}

// 정적 파일 서빙 (React 빌드 파일들)
app.UseDefaultFiles(); // index.html을 기본 파일로 설정
app.UseStaticFiles();  // wwwroot 폴더의 정적 파일 서빙

// HLS 스트리밍 파일 서빙
var hlsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Parking24web", "hls");
Directory.CreateDirectory(hlsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(hlsPath),
    RequestPath = "/hls",
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream"
});

app.UseRouting();
app.UseAuthorization();

// API 컨트롤러 매핑
app.MapControllers();

// SignalR Hub 매핑
app.MapHub<PLCHub>("/plcHub");

// SPA 폴백 라우팅 (React Router 지원)
app.MapFallbackToFile("index.html");

// 애플리케이션 시작 로그
var appLogger = app.Services.GetRequiredService<ILogger<Program>>();
var environment = app.Environment;

appLogger.LogInformation($"=== PLC 웹 제어 시스템 시작 ===");
appLogger.LogInformation($"현장: {siteName}");
appLogger.LogInformation($"환경: {environment.EnvironmentName}");
appLogger.LogInformation($"URL: {urls}");
appLogger.LogInformation($"설정 파일: {(File.Exists(siteConfigFile) ? siteConfigFile : "기본 설정")}");
appLogger.LogInformation($"정적 파일: {(environment.IsDevelopment() ? "React 개발서버" : "내장된 React 앱")}");
appLogger.LogInformation($"===========================");

// 서버 종료시 CCTV 정리 등록 (Graceful Shutdown)
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    appLogger.LogInformation("서버 종료 중 - CCTV 서비스 정리 시작");

    var cctvService = app.Services.GetService<CCTVService>();
    cctvService?.Dispose();

    appLogger.LogInformation("CCTV 서비스 정리 완료");
});

app.Run();

// 사이트 설정 클래스들 (PLCHub.cs와 동일한 구조)
public class SiteConfiguration
{
    public SiteInfo? SiteInfo { get; set; }
    public PlcConfig? PlcConfig { get; set; }
    public SystemAddresses? SystemAddresses { get; set; }
    public Dictionary<string, CommandConfig>? ControlCommands { get; set; }
    public Dictionary<string, int>? DataAddresses { get; set; }
    public VehicleStorage? VehicleStorage { get; set; }
    public Dictionary<string, int>? LiftPositions { get; set; }
    public ParkingMonitor? ParkingMonitor { get; set; }
    public SensorRanges? SensorRanges { get; set; }
}

public class SiteInfo
{
    public string Name { get; set; } = string.Empty;
    public string UnitNumber { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class PlcConfig
{
    public string Ip { get; set; } = string.Empty;
    public int Port { get; set; } = 2005;
    public string DeviceType { get; set; } = "C";
    public int StartAddress { get; set; } = 0;
}

public class SystemAddresses
{
    public int PlcComm { get; set; }
    public int RemoteOp { get; set; }
    public int PcComm { get; set; }
    public int SiteNumber { get; set; }
    public int UnitNumber { get; set; }
    public int ManualMode { get; set; }
    public int ErrorStatus { get; set; }
    public int EmergencyStop { get; set; }
    public int Heartbeat { get; set; }
}

public class VehicleStorage
{
    public int StartAddress { get; set; }
    public int EndAddress { get; set; }
    public int TotalSlots { get; set; }
}

public class ParkingMonitor
{
    public int VehicleAddressStart { get; set; }
    public int VehicleAddressEnd { get; set; }
    public int TotalSlots { get; set; }
    public bool HasPlateStatus { get; set; }
    public int LiftPositionStart { get; set; }
    public int EntranceLevel { get; set; }
    public int TurnLevel { get; set; }
}

public class SensorRanges
{
    public int SensorStartAddress { get; set; }
    public int SensorEndAddress { get; set; }
    public int TotalSensorWords { get; set; }
}

public class CommandConfig
{
    public string DeviceType { get; set; } = "C";
    public int Address { get; set; }
    public int? BitPosition { get; set; } = null;
    public string? Description { get; set; }
}