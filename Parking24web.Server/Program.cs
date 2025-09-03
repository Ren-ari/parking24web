using Parking24web.Server.Hubs;
using Parking24web.Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5124");

// 기존 서비스들
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllersWithViews();

// SignalR 서비스 추가
builder.Services.AddSignalR();

// PLC 서비스 싱글톤으로 등록
builder.Services.AddSingleton<PLCService>();

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

app.UseRouting();
app.UseAuthorization();

// API 컨트롤러 매핑
app.MapControllers();

// SignalR Hub 매핑
app.MapHub<PLCHub>("/plcHub");

// SPA 폴백 라우팅 (React Router 지원)
app.MapFallbackToFile("index.html");

// 애플리케이션 시작 로그
var logger = app.Services.GetRequiredService<ILogger<Program>>();
var environment = app.Environment;
var urls = "http://0.0.0.0:5124";

logger.LogInformation($"=== PLC 웹 제어 시스템 시작 ===");
logger.LogInformation($"환경: {environment.EnvironmentName}");
logger.LogInformation($"URL: {urls}");
logger.LogInformation($"정적 파일: {(environment.IsDevelopment() ? "React 개발서버" : "내장된 React 앱")}");
logger.LogInformation($"===========================");

app.Run();