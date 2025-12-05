@echo off
echo Starting Tripeaz Taxi Partners Dashboard Server...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using Node.js server...
    node server.js
    goto :end
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using Python server...
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop the server
    python -m http.server 8000
    goto :end
)

echo Error: Neither Node.js nor Python is installed.
echo Please install Node.js from https://nodejs.org/ or Python from https://www.python.org/
pause
:end


