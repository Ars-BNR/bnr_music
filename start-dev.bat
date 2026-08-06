@echo off
setlocal

set "BNR_ROOT=%~dp0"
set "BNR_SERVER=%BNR_ROOT%server"
set "BNR_CLIENT=%BNR_ROOT%client"

yarn --version >nul 2>&1
if errorlevel 1 (
  echo [BNR] Yarn was not found in PATH.
  echo [BNR] Install Yarn and restart this file.
  pause
  exit /b 1
)

if not exist "%BNR_SERVER%\package.json" (
  echo [BNR] Server directory was not found: "%BNR_SERVER%"
  pause
  exit /b 1
)

if not exist "%BNR_CLIENT%\package.json" (
  echo [BNR] Client directory was not found: "%BNR_CLIENT%"
  pause
  exit /b 1
)

if not exist "%BNR_SERVER%\node_modules" (
  echo [BNR] Server dependencies are missing. Run: cd server ^&^& yarn install
  pause
  exit /b 1
)

if not exist "%BNR_CLIENT%\node_modules" (
  echo [BNR] Client dependencies are missing. Run: cd client ^&^& yarn install
  pause
  exit /b 1
)

if /I "%~1"=="--check" (
  echo [BNR] Startup prerequisites are available.
  exit /b 0
)

echo [BNR] Starting NestJS server...
start "BNR Music - Server" /D "%BNR_SERVER%" cmd.exe /k "title BNR Music - Server ^&^& yarn start:dev"
if errorlevel 1 (
  echo [BNR] Failed to open the server window.
  pause
  exit /b 1
)

echo [BNR] Starting Next.js client...
start "BNR Music - Client" /D "%BNR_CLIENT%" cmd.exe /k "title BNR Music - Client ^&^& yarn dev"
if errorlevel 1 (
  echo [BNR] Failed to open the client window.
  pause
  exit /b 1
)

echo [BNR] Server and client windows were opened.
echo [BNR] Close those windows or press Ctrl+C in each one to stop development servers.
timeout /t 3 /nobreak >nul

endlocal
