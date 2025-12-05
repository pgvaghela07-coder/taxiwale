@echo off
echo ========================================
echo Starting Backend Server on Port 5000
echo ========================================
cd /d "%~dp0backend"
echo Current Directory: %CD%
echo.
echo Starting backend server...
npm start
pause

