# PowerShell script to build Schat Windows Installer
Write-Host "Building Schat Windows Installer" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if Flutter is installed
if (-not (Test-Command "flutter")) {
    Write-Host "Error: Flutter is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Flutter and add it to your PATH" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Inno Setup is installed
if (-not (Test-Command "iscc")) {
    Write-Host "Error: Inno Setup Compiler (iscc) is not found in PATH" -ForegroundColor Red
    Write-Host "Please install Inno Setup and add it to your PATH" -ForegroundColor Yellow
    Write-Host "Download from: https://jrsoftware.org/isinfo.php" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Cyan
    if (Test-Path "build") {
        Remove-Item -Path "build" -Recurse -Force
    }
    if (Test-Path "installer_output") {
        Remove-Item -Path "installer_output" -Recurse -Force
    }

    Write-Host "Step 2: Getting Flutter dependencies..." -ForegroundColor Cyan
    $result = flutter pub get
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get Flutter dependencies"
    }

    Write-Host "Step 3: Building Flutter Windows app..." -ForegroundColor Cyan
    $result = flutter build windows --release
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Flutter Windows app"
    }

    Write-Host "Step 4: Verifying build output..." -ForegroundColor Cyan
    $exePath = "build\windows\x64\runner\Release\schat_windows.exe"
    if (-not (Test-Path $exePath)) {
        throw "Built executable not found at: $exePath"
    }

    Write-Host "Step 5: Creating installer directory..." -ForegroundColor Cyan
    if (-not (Test-Path "installer_output")) {
        New-Item -ItemType Directory -Path "installer_output" | Out-Null
    }

    Write-Host "Step 6: Building installer with Inno Setup..." -ForegroundColor Cyan
    $result = iscc "installer.iss"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create installer"
    }

    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installer created: installer_output\SchatSetup.exe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can now distribute the SchatSetup.exe file to install Schat on Windows systems." -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"
