@echo off
title Backend Server - Port 5000
color 0A
echo.
echo ========================================
echo   TRIPEAZ TAXI - BACKEND SERVER
echo ========================================
echo.
echo Starting server on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the server
node src/server.js

pause

