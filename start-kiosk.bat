@echo off
title SUVIDHA Kiosk Launcher
echo.
echo  ========================================
echo   SUVIDHA Government Kiosk - Local Mode
echo  ========================================
echo.

:: ── Check Node ───────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)

:: ── Check Python ─────────────────────────────────────────────────────────────
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install from https://python.org
    pause & exit /b 1
)

:: ── Check PM2 ────────────────────────────────────────────────────────────────
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo [SETUP] Installing PM2...
    call npm install -g pm2
)

:: ── Build React app (only if dist/ missing or outdated) ──────────────────────
if not exist "dist\index.html" (
    echo [BUILD] Building React app...
    call npm install
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] React build failed.
        pause & exit /b 1
    )
    echo [BUILD] Done.
) else (
    echo [BUILD] dist/ exists - skipping rebuild. Delete dist\ to force rebuild.
)

:: ── Stop any existing PM2 processes ──────────────────────────────────────────
echo [PM2] Stopping old processes...
pm2 delete all >nul 2>&1

:: ── Start all services via PM2 ───────────────────────────────────────────────
echo [PM2] Starting all services...
pm2 start ecosystem.config.cjs

:: ── Wait for Express to be ready ─────────────────────────────────────────────
echo [WAIT] Waiting for server to start...
timeout /t 4 /nobreak >nul

:: ── Open Chrome in kiosk mode ────────────────────────────────────────────────
echo [BROWSER] Opening kiosk...
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME=chrome

start "" %CHROME% --kiosk http://localhost:3000 --disable-infobars --no-sandbox --disable-features=TranslateUI --noerrdialogs

echo.
echo  ========================================
echo   Kiosk running at http://localhost:3000
echo   PM2 status: pm2 status
echo   Logs:       pm2 logs
echo   Stop:       pm2 delete all
echo  ========================================
echo.
