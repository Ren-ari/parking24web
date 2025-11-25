[Setup]
; 기본 정보  
AppName=EPSAI Parking24 (속초 2,3호기)
PrivilegesRequired=admin
AppVersion=1.0.0
AppPublisher=EPSAI
AppPublisherURL=https://epsai.co.kr/
AppSupportURL=https://epsai.co.kr/
AppUpdatesURL=https://epsai.co.kr/
DefaultDirName={autopf}\EPSAI Parking24 Sokcho2
UninstallDisplayIcon={app}\Parking24web.Server.exe
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
OutputBaseFilename=Parking24_Sokcho2_Setup
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; 전체 publish 폴더 복사 (상위 폴더의 publish 참조)
Source: "..\publish_sokcho2\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; 프로그램 메뉴 아이콘 (기존 스크립트 아이콘 사용)
Name: "{autoprograms}\EPSAI Parking24 Server"; Filename: "{app}\Parking24web.Server.exe"; WorkingDir: "{app}"; IconFilename: "{sys}\shell32.dll"; IconIndex: 174
Name: "{autoprograms}\Parking24 웹 접속"; Filename: "http://localhost:5124"; IconFilename: "{sys}\shell32.dll"; IconIndex: 106

; 바탕화면 아이콘 (선택사항)  
Name: "{autodesktop}\EPSAI Parking24 Server"; Filename: "{app}\Parking24web.Server.exe"; WorkingDir: "{app}"; Tasks: desktopicon; IconFilename: "{sys}\shell32.dll"; IconIndex: 174
Name: "{autodesktop}\Parking24 웹 접속"; Filename: "http://localhost:5124"; Tasks: desktopicon; IconFilename: "{sys}\shell32.dll"; IconIndex: 106

[Run]
; 설치 완료 후 실행 옵션
Filename: "{app}\Parking24web.Server.exe"; Description: "EPSAI Parking24 Server 실행"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent
Filename: "http://localhost:5124"; Description: "Parking24 웹 접속하기"; Flags: nowait postinstall skipifsilent shellexec

[UninstallDelete]
; 언인스톨 시 추가 삭제할 파일들
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\temp"