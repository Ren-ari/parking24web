using Parking24web.Server.Hubs;
using Parking24web.Server.Services;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5124");

// ���� ���񽺵�
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllersWithViews();

// SignalR ���� �߰�
builder.Services.AddSignalR();

// PLC ���� �̱������� ���
builder.Services.AddSingleton<PLCService>();

// CORS ���� (����/���δ��� �и�)
builder.Services.AddCors(options =>
{
    // ���δ��ǿ� - �����������Ͽ��� ���
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    // ���߿� - React ���� ������ ���
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("https://localhost:5173", "http://localhost:5173",
                          "https://0.0.0.0:5173", "http://0.0.0.0:5173") // �ܺ� ���ӿ� �߰�
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // SignalR�� �ʼ�
    });
});

var app = builder.Build();

// ȯ�溰 ����
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // ����ȯ�濡���� React ���߼����� CORS
    app.UseCors("AllowReactApp");
}
else
{
    // ���δ��� ȯ�� (������������)
    app.UseExceptionHandler("/Error");
    app.UseHsts();

    // ���δ��ǿ����� ��� origin ���
    app.UseCors("AllowAll");
}

// ���� ���� ���� (React ���� ���ϵ�)
app.UseDefaultFiles(); // index.html�� �⺻ ���Ϸ� ����
app.UseStaticFiles();  // wwwroot ������ ���� ���� ����

app.UseRouting();
app.UseAuthorization();

// API ��Ʈ�ѷ� ����
app.MapControllers();

// SignalR Hub ����
app.MapHub<PLCHub>("/plcHub");

// SPA ���� ����� (React Router ����)
app.MapFallbackToFile("index.html");

// ���ø����̼� ���� �α�
var logger = app.Services.GetRequiredService<ILogger<Program>>();
var environment = app.Environment;
var urls = "http://0.0.0.0:5124";

logger.LogInformation($"=== PLC �� ���� �ý��� ���� ===");
logger.LogInformation($"ȯ��: {environment.EnvironmentName}");
logger.LogInformation($"URL: {urls}");
logger.LogInformation($"���� ����: {(environment.IsDevelopment() ? "React ���߼���" : "����� React ��")}");
logger.LogInformation($"===========================");

app.Run();