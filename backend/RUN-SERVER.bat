@echo off
cd /d "%~dp0"
echo Starting Backend Server...
echo.
node src/server.js
if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start!
    echo Check the error message above.
    pause
)

