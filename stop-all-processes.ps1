# Chatbot Project - Stop All Processes Script
# This script stops all running processes related to the chatbot application

Write-Host "Stopping Chatbot Application Processes..." -ForegroundColor Yellow
Write-Host ""

# Function to safely kill processes by PID
function Stop-ProcessSafely {
    param([int]$ProcessId, [string]$ProcessName)
    try {
        if (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue) {
            Stop-Process -Id $ProcessId -Force -ErrorAction Stop
            Write-Host "[SUCCESS] Stopped $ProcessName (PID: $ProcessId)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "[WARNING] Could not stop $ProcessName (PID: $ProcessId): $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
    return $false
}

# Function to stop processes by name
function Stop-ProcessesByName {
    param([string]$ProcessName, [string]$Description)
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "[FOUND] Found $($processes.Count) $Description process(es)" -ForegroundColor Cyan
        foreach ($process in $processes) {
            Stop-ProcessSafely -ProcessId $process.Id -ProcessName "$Description ($($process.ProcessName))"
        }
    } else {
        Write-Host "[INFO] No $Description processes found" -ForegroundColor Gray
    }
}

# Function to stop processes listening on specific ports
function Stop-ProcessesOnPorts {
    param([int[]]$Ports)
    foreach ($port in $Ports) {
        Write-Host "[CHECK] Checking port $port..." -ForegroundColor Cyan
        $connections = netstat -ano | Select-String ":$port "
        if ($connections) {
            foreach ($connection in $connections) {
                $connectionStr = $connection.ToString().Trim()
                $parts = $connectionStr -split '\s+' | Where-Object { $_ -ne '' }
                if ($parts.Length -ge 5) {
                    $pidString = $parts[4]
                    if ($pidString -match '^\d+$') {
                        $processId = [int]$pidString
                        try {
                            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                            if ($process) {
                                Stop-ProcessSafely -ProcessId $processId -ProcessName "Port $port listener ($($process.ProcessName))"
                            }
                        }
                        catch {
                            Write-Host "[WARNING] Could not identify process on port $port (PID: $pidString)" -ForegroundColor Yellow
                        }
                    }
                }
            }
        } else {
            Write-Host "[INFO] Port $port is not in use" -ForegroundColor Gray
        }
    }
}

Write-Host "1. Stopping .NET Core processes..." -ForegroundColor Blue
Stop-ProcessesByName -ProcessName "dotnet" -Description ".NET Core"

Write-Host ""
Write-Host "2. Stopping Node.js processes..." -ForegroundColor Blue
Stop-ProcessesByName -ProcessName "node" -Description "Node.js"
Stop-ProcessesByName -ProcessName "npm" -Description "NPM"
Stop-ProcessesByName -ProcessName "ng" -Description "Angular CLI"

Write-Host ""
Write-Host "3. Stopping webpack and build processes..." -ForegroundColor Blue
Stop-ProcessesByName -ProcessName "webpack" -Description "Webpack"
Stop-ProcessesByName -ProcessName "webpack-dev-server" -Description "Webpack Dev Server"

Write-Host ""
Write-Host "4. Stopping processes on application ports..." -ForegroundColor Blue
$applicationPorts = @(7271, 4200, 5204)  # Backend HTTPS, Frontend, Backend HTTP
Stop-ProcessesOnPorts -Ports $applicationPorts

Write-Host ""
Write-Host "5. Cleaning up any remaining related processes..." -ForegroundColor Blue

# Stop any processes with 'chatbot' in their command line or working directory
$allProcesses = Get-WmiObject -Class Win32_Process | Where-Object { 
    $_.CommandLine -like "*chatbot*" -or 
    $_.CommandLine -like "*Sematic*" -or
    ($_.ProcessName -eq "node.exe" -and $_.CommandLine -like "*ng serve*") -or
    ($_.ProcessName -eq "dotnet.exe" -and $_.CommandLine -like "*ChatbotApi*")
}

if ($allProcesses) {
    Write-Host "[FOUND] Found $($allProcesses.Count) additional related process(es)" -ForegroundColor Cyan
    foreach ($process in $allProcesses) {
        Stop-ProcessSafely -ProcessId $process.ProcessId -ProcessName "Related process ($($process.ProcessName))"
    }
} else {
    Write-Host "[INFO] No additional related processes found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "6. Verifying ports are freed..." -ForegroundColor Blue
$portsInUse = @()
foreach ($port in $applicationPorts) {
    $portCheck = netstat -ano | Select-String ":$port "
    if ($portCheck) {
        $portsInUse += $port
        Write-Host "[WARNING] Port $port is still in use" -ForegroundColor Yellow
    } else {
        Write-Host "[SUCCESS] Port $port is free" -ForegroundColor Green
    }
}

Write-Host ""
if ($portsInUse.Count -eq 0) {
    Write-Host "[SUCCESS] All chatbot application processes stopped successfully!" -ForegroundColor Green
    Write-Host "[SUCCESS] All application ports (7271, 4200, 5204) are now available" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Some ports are still in use: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "[INFO] You may need to manually stop remaining processes or restart VS Code/Windows" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "[COMPLETED] Script execution finished!" -ForegroundColor Magenta
