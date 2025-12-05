@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

cd /d "%~dp0"
echo Current Directory: %CD%
echo.

echo Step 1: Installing dependencies (if needed)...
call npm install
echo.

echo Step 2: Starting server on port 5000...
echo.
echo Server will start at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

npm start

pause

