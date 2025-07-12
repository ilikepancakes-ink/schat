[Setup]
; Basic application information
AppName=Schat
AppVersion=1.0.0
AppPublisher=Your Company Name
AppPublisherURL=https://yourwebsite.com
AppSupportURL=https://yourwebsite.com/support
AppUpdatesURL=https://yourwebsite.com/updates
DefaultDirName={autopf}\Schat
DefaultGroupName=Schat
AllowNoIcons=yes
LicenseFile=..\LICENSE
InfoBeforeFile=README.md
OutputDir=installer_output
OutputBaseFilename=SchatSetup
SetupIconFile=assets\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; Minimum Windows version (Windows 10)
MinVersion=10.0.17763

; Uninstall information
UninstallDisplayName=Schat
UninstallDisplayIcon={app}\schat_windows.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; Main executable and Flutter engine
Source: "build\windows\x64\runner\Release\schat_windows.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\windows\x64\runner\Release\flutter_windows.dll"; DestDir: "{app}"; Flags: ignoreversion

; Flutter plugins and dependencies
Source: "build\windows\x64\runner\Release\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

; Data directory
Source: "build\windows\x64\runner\Release\data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs createallsubdirs

; Visual C++ Redistributable (if needed)
; Uncomment the following line if your app requires Visual C++ Redistributable
; Source: "redist\VC_redist.x64.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\Schat"; Filename: "{app}\schat_windows.exe"
Name: "{group}\{cm:UninstallProgram,Schat}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Schat"; Filename: "{app}\schat_windows.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Schat"; Filename: "{app}\schat_windows.exe"; Tasks: quicklaunchicon

[Run]
; Install Visual C++ Redistributable if needed
; Uncomment the following line if your app requires Visual C++ Redistributable
; Filename: "{tmp}\VC_redist.x64.exe"; Parameters: "/quiet"; StatusMsg: "Installing Visual C++ Redistributable..."; Check: VCRedistNeedsInstall

; Launch the application after installation
Filename: "{app}\schat_windows.exe"; Description: "{cm:LaunchProgram,Schat}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
// Function to check if Visual C++ Redistributable is needed
function VCRedistNeedsInstall: Boolean;
begin
  // Add logic here to check if VC++ Redistributable is already installed
  // For now, we'll assume it's not needed
  Result := False;
end;

// Custom page for additional options (optional)
procedure InitializeWizard;
begin
  // Add any custom initialization here
end;

// Function called before installation starts
function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := '';
  // Add any pre-installation checks here
end;

// Function called after successful installation
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Add any post-installation tasks here
    // For example, creating registry entries, setting up file associations, etc.
  end;
end;
