@echo off
chcp 65001 >nul
echo ===============================================
echo    EPSAI Parking24 속초2,3호기 빌드 스크립트
echo ===============================================
set BASE_DIR=%~dp0
set SITE_NAME=Sokcho2

echo.
echo [1/5] 환경변수 설정...
set SITE_NAME=Sokcho2
echo 현장 설정: %SITE_NAME%

echo.
echo [2/5] React 클라이언트 빌드 중...
cd /d "%BASE_DIR%parking24web.client"
call npm run build
if errorlevel 1 (
    echo ERROR: React 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [3/5] React 빌드 결과를 서버로 복사 중...
if exist "%BASE_DIR%Parking24web.Server\wwwroot" (
    rmdir /s /q "%BASE_DIR%Parking24web.Server\wwwroot"
)
xcopy "%BASE_DIR%parking24web.client\dist" "%BASE_DIR%Parking24web.Server\wwwroot\" /E /I /Y
if errorlevel 1 (
    echo ERROR: 파일 복사 실패!
    pause
    exit /b 1
)

echo.
echo [4/5] .NET 서버 발행 중...
cd /d "%BASE_DIR%Parking24web.Server"
dotnet publish -c Release -o "%BASE_DIR%publish_sokcho2" --self-contained true -r win-x64
if errorlevel 1 (
    echo ERROR: .NET 발행 실패!
    pause
    exit /b 1
)

echo.
echo [5/5] 속초2,3호기 설치 프로그램 생성 중...
if exist "%BASE_DIR%setup\Parking24_Setup_Sokcho2.iss" (
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "%BASE_DIR%setup\Parking24_Setup_Sokcho2.iss"
    if errorlevel 1 (
        echo ERROR: 설치 프로그램 생성 실패!
        pause
        exit /b 1
    )
    echo.
    echo ✅ 속초2,3호기 설치 프로그램이 성공적으로 생성되었습니다!
    echo 📁 위치: %BASE_DIR%setup\Output\Parking24_Sokcho2_Setup.exe
) else (
    echo ✅ 발행 완료!
    echo 📁 위치: %BASE_DIR%publish_sokcho2\
    echo 💡 Inno Setup 스크립트가 없습니다. 수동으로 설치 프로그램을 만드세요.
)

echo.
echo ===============================================
echo              속초2,3호기 빌드 완료! 
echo ===============================================
pause