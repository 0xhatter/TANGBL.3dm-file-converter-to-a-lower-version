@echo off
REM Build standalone Windows executables with embedded Python using PyInstaller
REM - GUI app: 3DMVersionConverter.exe (no console)
REM - CLI app: 3DMConverterCLI.exe (console)

setlocal ENABLEDELAYEDEXPANSION

where python >nul 2>&1
if errorlevel 1 (
  echo Python not found in PATH. Please install Python 3.8+ from https://www.python.org/downloads/windows/ and check 'Add to PATH'.
  exit /b 1
)

REM Ensure pip and required packages
python -m pip install --upgrade pip
python -m pip install -r "%~dp0requirements.txt"
python -m pip install pyinstaller

REM Clean previous builds
pushd "%~dp0"
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
if exist __pycache__ rmdir /s /q __pycache__

echo Building GUI executable...
pyinstaller --noconfirm ^
  --noconsole ^
  --name 3DMVersionConverter ^
  --add-data "%~dp0README.md;." ^
  "%~dp0gui.py"

if errorlevel 1 (
  echo GUI build failed.
  popd
  exit /b 1
)

echo Building CLI executable...
pyinstaller --noconfirm ^
  --console ^
  --name 3DMConverterCLI ^
  "%~dp0converter.py"

if errorlevel 1 (
  echo CLI build failed.
  popd
  exit /b 1
)

REM Package the GUI app folder as a zip for distribution
powershell -NoProfile -Command "Compress-Archive -Path 'dist/3DMVersionConverter/*' -DestinationPath '3DMVersionConverter_Windows.zip' -Force" 2>nul
if errorlevel 1 (
  echo Skipping auto-zip (PowerShell Compress-Archive not available). Artifacts are in dist\.
) else (
  echo Created 3DMVersionConverter_Windows.zip
)

echo Done. Find your executables in: %CD%\dist\
popd
endlocal
