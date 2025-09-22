@echo off
chcp 65001 >nul
echo ===============================================
echo    EPSAI Parking24 속초1호기 빌드 스크립트
echo ===============================================
set BASE_DIR=%~dp0
set SITE_NAME=Sokcho1

echo.
echo [1/5] 환경변수 설정...
set SITE_NAME=Sokcho1
echo 현장 설정: %SITE_NAME%

echo.
echo [2/5] React 클라이언트 빌드 중...
cd /d "%BASE_DIR%parking24web.client"
call npm run build

echo.
echo [3/5] React 빌드 결과를 서버로 복사 중...
if exist "%BASE_DIR%Parking24web.Server\wwwroot" (
    rmdir /s /q "%BASE_DIR%Parking24web.Server\wwwroot"
)
xcopy "%BASE_DIR%parking24web.client\dist" "%BASE_DIR%Parking24web.Server\wwwroot\" /E /I /Y

echo.
echo [4/5] .NET 서버 발행중...
cd /d "%BASE_DIR%Parking24web.Server"
dotnet publish -c Release -o "%BASE_DIR%publish_sokcho1" --self-contained true -r win-x64

echo.
echo [5/5] 속초1호기 설치 프로그램 생성중...
if exist "%BASE_DIR%setup\Parking24_Setup_Sokcho1.iss" (
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "%BASE_DIR%setup\Parking24_Setup_Sokcho1.iss"
    echo ✅ 속초1호기 설치 프로그램 생성 완료!
    echo 📁 위치: %BASE_DIR%setup\Output\Parking24_Sokcho1_Setup.exe
)
pause