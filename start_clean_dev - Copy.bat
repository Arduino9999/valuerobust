@echo off
setlocal EnableDelayedExpansion

set "PORT=4000"

REM ────────────────────────────────
REM  Auto-elevate to Administrator
REM ────────────────────────────────
>nul 2>&1 net session
if %errorlevel% neq 0 (
  echo [!] Elevation required — restarting as Administrator...
  powershell -Command "Start-Process -Verb RunAs -FilePath '%~f0'"
  exit /b
)

echo ===========================
echo   Killing Port %PORT%...
echo ===========================

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  set PID=%%a
  echo Found PID !PID! using port %PORT%
  echo Attempting to kill PID !PID! and its parent...

  for /f "tokens=2 delims==;" %%p in ('wmic path win32_process where "ProcessId=!PID!" get ParentProcessId /value ^| find "="') do set PPID=%%p

  powershell -NoProfile -Command "try { Stop-Process -Id !PID! -Force -ErrorAction SilentlyContinue } catch {}"
  powershell -NoProfile -Command "try { Stop-Process -Id !PPID! -Force -ErrorAction SilentlyContinue } catch {}"
  taskkill /PID !PID! /F /T >nul 2>&1
  taskkill /PID !PPID! /F /T >nul 2>&1
)

echo.
echo Verifying port %PORT% is free...
set "CHK="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do set CHK=%%a

if defined CHK (
  echo [!] Port %PORT% still busy. Forcing global node kill...
  taskkill /F /IM node.exe /T >nul 2>&1
  taskkill /F /IM nodemon.exe /T >nul 2>&1
  timeout /t 2 >nul
)

echo.
netstat -ano | findstr :%PORT%
if %errorlevel% equ 0 (
  echo [!] Port %PORT% STILL occupied! Try rebooting or changing PORT in .env
  pause
  exit /b 1
)

echo Port %PORT% is free.
echo ===========================
echo   Starting development...
echo ===========================

call npm run dev

endlocal
