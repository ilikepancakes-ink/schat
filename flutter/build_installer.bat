@echo off
echo Building Schat Windows Installer
echo ================================

:: Check if Flutter is installed
flutter --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Flutter is not installed or not in PATH
    echo Please install Flutter and add it to your PATH
    pause
    exit /b 1
)

:: Check if Inno Setup is installed
where iscc >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Inno Setup Compiler (iscc) is not found in PATH
    echo Please install Inno Setup and add it to your PATH
    echo Download from: https://jrsoftware.org/isinfo.php
    pause
    exit /b 1
)

echo Step 1: Cleaning previous builds...
if exist "build" rmdir /s /q "build"
if exist "installer_output" rmdir /s /q "installer_output"

echo Step 2: Getting Flutter dependencies...
flutter pub get
if %errorlevel% neq 0 (
    echo Error: Failed to get Flutter dependencies
    pause
    exit /b 1
)

echo Step 3: Building Flutter Windows app...
flutter build windows --release
if %errorlevel% neq 0 (
    echo Error: Failed to build Flutter Windows app
    pause
    exit /b 1
)

echo Step 4: Verifying build output...
if not exist "build\windows\x64\runner\Release\schat_windows.exe" (
    echo Error: Built executable not found
    echo Expected: build\windows\x64\runner\Release\schat_windows.exe
    pause
    exit /b 1
)

echo Step 5: Creating installer directory...
if not exist "installer_output" mkdir "installer_output"

echo Step 6: Building installer with Inno Setup...
iscc "installer.iss"
if %errorlevel% neq 0 (
    echo Error: Failed to create installer
    pause
    exit /b 1
)

echo.
echo ================================
echo Build completed successfully!
echo.
echo Installer created: installer_output\SchatSetup.exe
echo.
echo You can now distribute the SchatSetup.exe file to install Schat on Windows systems.
echo.
pause
