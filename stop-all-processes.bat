@echo off
REM Chatbot Project - Stop All Processes (Batch Version)
REM Simple version that stops common processes

echo.
echo 🔄 Stopping Chatbot Application Processes...
echo.

echo 1️⃣ Stopping .NET processes...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq dotnet.exe" /FO csv ^| find "dotnet.exe"') do (
    echo Stopping dotnet.exe process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 2️⃣ Stopping Node.js processes...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO csv ^| find "node.exe"') do (
    echo Stopping node.exe process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 3️⃣ Stopping npm processes...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq npm.exe" /FO csv ^| find "npm.exe"') do (
    echo Stopping npm.exe process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 4️⃣ Stopping any processes on application ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":7271 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4200 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5204 "') do taskkill /PID %%a /F >nul 2>&1

echo.
echo ✅ Process cleanup completed!
echo.
pause
