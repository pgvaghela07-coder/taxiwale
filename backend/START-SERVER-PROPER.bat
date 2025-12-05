@echo off
echo ========================================
echo Starting Backend Server on Port 5000
echo ========================================
echo.

cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)
echo.

echo Installing dependencies (if needed)...
call npm install
echo.

echo Starting server...
echo Server will run on: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

node src/server.js

pause

