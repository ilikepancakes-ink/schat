# Schat Windows Installer

This directory contains the Inno Setup script and build tools to create a Windows installer for the Schat Flutter application.

## Prerequisites

Before building the installer, make sure you have the following installed:

### 1. Flutter SDK
- Download and install Flutter from: https://flutter.dev/docs/get-started/install/windows
- Add Flutter to your system PATH
- Verify installation: `flutter doctor`

### 2. Inno Setup
- Download and install Inno Setup from: https://jrsoftware.org/isinfo.php
- During installation, make sure to add Inno Setup to your PATH, or manually add the installation directory (usually `C:\Program Files (x86)\Inno Setup 6\`) to your PATH

### 3. Visual Studio Build Tools (if not already installed)
- Flutter Windows apps require Visual Studio build tools
- Install Visual Studio Community or just the Build Tools for Visual Studio
- Make sure to include the "Desktop development with C++" workload

## Building the Installer

### Option 1: Using the Batch Script (Recommended)
1. Open Command Prompt or PowerShell
2. Navigate to the flutter directory: `cd flutter`
3. Run the build script: `build_installer.bat`

### Option 2: Using the PowerShell Script
1. Open PowerShell
2. Navigate to the flutter directory: `cd flutter`
3. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (if needed)
4. Run the build script: `.\build_installer.ps1`

### Option 3: Manual Build
1. Open Command Prompt in the flutter directory
2. Get dependencies: `flutter pub get`
3. Build the app: `flutter build windows --release`
4. Create installer: `iscc installer.iss`

## What the Build Process Does

1. **Cleans previous builds** - Removes old build and installer output directories
2. **Gets Flutter dependencies** - Runs `flutter pub get` to ensure all packages are available
3. **Builds the Windows app** - Compiles the Flutter app for Windows in release mode
4. **Verifies the build** - Checks that the executable was created successfully
5. **Creates the installer** - Uses Inno Setup to package everything into an installer

## Output

After a successful build, you'll find:
- `installer_output/SchatSetup.exe` - The Windows installer
- `build/windows/x64/runner/Release/` - The built Flutter application files

## Customizing the Installer

You can modify `installer.iss` to customize:

### Basic Information
- App name, version, publisher information
- Installation directory
- License file and readme

### Files to Include
- Add or remove files in the `[Files]` section
- Include additional dependencies or assets

### Desktop Icons and Shortcuts
- Modify the `[Icons]` section to change shortcut creation
- Add or remove desktop/start menu icons

### Installation Options
- Add custom installation tasks in the `[Tasks]` section
- Modify user choices during installation

### Post-Installation Actions
- Add registry entries
- Set up file associations
- Run additional setup commands

## Troubleshooting

### Common Issues

1. **Flutter not found**
   - Make sure Flutter is installed and in your PATH
   - Run `flutter doctor` to verify installation

2. **Inno Setup Compiler not found**
   - Install Inno Setup and add it to your PATH
   - Verify with: `iscc` (should show version info)

3. **Build fails with compilation errors**
   - Run `flutter doctor` to check for issues
   - Make sure Visual Studio build tools are installed
   - Try `flutter clean` then rebuild

4. **Missing DLL errors**
   - The installer script includes common Flutter DLLs
   - If you added plugins, you may need to include additional DLLs in the `[Files]` section

### Getting Help

- Check Flutter documentation: https://flutter.dev/docs
- Inno Setup documentation: https://jrsoftware.org/ishelp/
- Flutter Windows deployment: https://flutter.dev/docs/deployment/windows

## Distribution

The generated `SchatSetup.exe` can be distributed to end users. It will:
- Install the application to Program Files
- Create desktop and start menu shortcuts (if selected)
- Set up uninstall information
- Handle Windows version compatibility

Users simply need to run the installer - no additional dependencies required.
