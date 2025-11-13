@echo off
setlocal EnableDelayedExpansion
title ValueFinder Dev Launcher

rem Ports to clean: API 4000 + Vite 5173–5199
set "PORTS=4000"
for /l %%p in (5173,1,5199) do set "PORTS=!PORTS! %%p"

echo ===========================
echo   Cleaning dev ports...
echo ===========================

for %%P in (%PORTS%) do call :KillPort %%P
timeout /t 1 >nul
for %%P in (%PORTS%) do call :KillPort %%P

rem Final verification; if anything still LISTENING, kill node/nodemon then retry once
set "STILLBUSY="
for %%P in (%PORTS%) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%%P " ^| findstr /I LISTENING') do set "STILLBUSY=1"
)

if defined STILLBUSY (
  echo [!] Some ports still busy; killing node.exe/nodemon.exe globally...
  taskkill /F /IM node.exe /T >nul 2>&1
  taskkill /F /IM nodemon.exe /T >nul 2>&1
  timeout /t 1 >nul
  for %%P in (%PORTS%) do call :KillPort %%P
)

echo Ports cleaned.
echo.
echo ===========================
echo   Starting development...
echo ===========================
npm run dev
exit /b 0

:KillPort
set "KPORT=%~1"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":%KPORT% " ^| findstr /I LISTENING') do (
  echo Killing PID %%a on port %KPORT%
  taskkill /PID %%a /F /T >nul 2>&1
)
exit /b 0

