@echo off
chcp 65001 >nul
echo ===============================================
echo    EPSAI Parking24 자동 빌드 및 배포 스크립트
echo ===============================================

REM 현재 스크립트가 있는 폴더를 기준으로 설정
set BASE_DIR=%~dp0

echo.
echo [1/4] React 클라이언트 빌드 중...
cd /d "%BASE_DIR%parking24web.client"
call npm run build
if errorlevel 1 (
    echo ERROR: React 빌드 실패!
    pause
    exit /b 1
)

echo.
echo [2/4] React 빌드 결과를 서버로 복사 중...
REM 기존 wwwroot 삭제
if exist "%BASE_DIR%Parking24web.Server\wwwroot" (
    rmdir /s /q "%BASE_DIR%Parking24web.Server\wwwroot"
)

REM dist 폴더를 wwwroot로 복사 (Vite는 dist 폴더 사용)
xcopy "%BASE_DIR%parking24web.client\dist" "%BASE_DIR%Parking24web.Server\wwwroot\" /E /I /Y
if errorlevel 1 (
    echo ERROR: 파일 복사 실패!
    pause
    exit /b 1
)

echo.
echo [3/4] .NET 서버 발행(Publish) 중...
cd /d "%BASE_DIR%Parking24web.Server"
dotnet publish -c Release -o "%BASE_DIR%publish" --self-contained true -r win-x64
if errorlevel 1 (
    echo ERROR: .NET 발행 실패!
    pause
    exit /b 1
)

echo.
echo [4/4] 설치 프로그램 생성 중...
if exist "%BASE_DIR%setup\Parking24_Setup.iss" (
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "%BASE_DIR%setup\Parking24_Setup.iss"
    if errorlevel 1 (
        echo ERROR: 설치 프로그램 생성 실패!
        pause
        exit /b 1
    )
    echo.
    echo ✅ 설치 프로그램이 성공적으로 생성되었습니다!
    echo 📁 위치: %BASE_DIR%setup\Output\Parking24_Setup.exe
) else (
    echo ✅ 발행 완료!
    echo 📁 위치: %BASE_DIR%publish\
    echo 💡 Inno Setup 스크립트가 없습니다. 수동으로 설치 프로그램을 만드세요.
)

echo.
echo ===============================================
echo                  빌드 완료! 
echo ===============================================
pause