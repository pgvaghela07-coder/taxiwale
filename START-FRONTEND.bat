@echo off
echo ========================================
echo Starting Frontend Server on Port 3000
echo ========================================
cd /d "%~dp0"
echo Current Directory: %CD%
echo.
echo Checking http-server installation...
where http-server >nul 2>&1
if %errorlevel% neq 0 (
    echo http-server not found. Installing...
    call npm install -g http-server
)
echo.
echo Starting frontend server on http://localhost:3000...
http-server -p 3000 -o
pause

