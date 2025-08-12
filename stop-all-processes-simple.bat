@echo off
echo Stopping Chatbot Application Processes...
echo.

echo 1. Stopping .NET processes...
taskkill /f /im dotnet.exe >nul 2>&1
if %errorlevel% equ 0 (echo [SUCCESS] .NET processes stopped) else (echo [INFO] No .NET processes found)

echo.
echo 2. Stopping Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (echo [SUCCESS] Node.js processes stopped) else (echo [INFO] No Node.js processes found)

echo.
echo 3. Stopping npm processes...
taskkill /f /im npm.exe >nul 2>&1
if %errorlevel% equ 0 (echo [SUCCESS] npm processes stopped) else (echo [INFO] No npm processes found)

echo.
echo 4. Checking application ports...
netstat -ano | findstr ":7271" >nul 2>&1
if %errorlevel% equ 0 (echo [WARNING] Port 7271 still in use) else (echo [SUCCESS] Port 7271 is free)

netstat -ano | findstr ":4200" >nul 2>&1
if %errorlevel% equ 0 (echo [WARNING] Port 4200 still in use) else (echo [SUCCESS] Port 4200 is free)

netstat -ano | findstr ":5204" >nul 2>&1
if %errorlevel% equ 0 (echo [WARNING] Port 5204 still in use) else (echo [SUCCESS] Port 5204 is free)

echo.
echo [COMPLETED] Process cleanup finished!
echo.
pause
