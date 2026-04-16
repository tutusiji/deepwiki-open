@echo off
setlocal

cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 scripts\install_python_deps.py %*
  exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
  python scripts\install_python_deps.py %*
  exit /b %errorlevel%
)

echo [ERROR] Python 3.11+ not found in PATH. Install Python and retry.
exit /b 1
