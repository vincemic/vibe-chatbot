# Process Management Scripts

This directory contains scripts to help manage the chatbot application processes.

## Available Scripts

### 1. PowerShell Script (Recommended)

**File:** `stop-all-processes.ps1`

**Features:**

- ✅ Comprehensive process detection and termination
- ✅ Port-based process identification  
- ✅ Detailed logging and status reporting
- ✅ Safe error handling
- ✅ Verification of port availability

**Usage:**

```powershell
# Run from PowerShell in the project directory
.\stop-all-processes.ps1

# Or run from anywhere
PowerShell -ExecutionPolicy Bypass -File "C:\repos\Sematic\stop-all-processes.ps1"
```

### 2. Batch Script (Simple Alternative)

**File:** `stop-all-processes.bat`

**Features:**

- ✅ Simple and fast execution
- ✅ Works without PowerShell execution policy issues
- ✅ Basic process termination

**Usage:**

```cmd
# Double-click the file or run from command prompt
stop-all-processes.bat
```

## What Gets Stopped

Both scripts will terminate:

1. **Backend Processes:**
   - All `dotnet.exe` processes (ASP.NET Core API)
   - Processes listening on port 7271 (HTTPS)
   - Processes listening on port 5204 (HTTP)

2. **Frontend Processes:**
   - All `node.exe` processes (Angular dev server)
   - All `npm.exe` processes
   - Angular CLI (`ng`) processes
   - Webpack and webpack-dev-server processes
   - Processes listening on port 4200

3. **Related Processes:**
   - Any processes with "chatbot" or "Sematic" in command line
   - Any processes running from the project directory

## Execution Policy (PowerShell)

If you get an execution policy error, run this command first:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Troubleshooting

### "Port still in use" warning

- Some processes may take a few seconds to fully release ports
- Try running the script again after 10-15 seconds
- If persistent, restart VS Code or reboot Windows

### "Access denied" errors

- Run the script as Administrator if needed
- Some system processes cannot be terminated by user scripts

### Process detection issues

- The PowerShell script provides more detailed error reporting
- Check VS Code's integrated terminal for any hidden processes
- Use Task Manager to manually identify stubborn processes

## Integration with VS Code

You can add these scripts to VS Code tasks by adding to `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Stop All Processes",
            "type": "shell",
            "command": "${workspaceFolder}/stop-all-processes.ps1",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        }
    ]
}
```

Then use `Ctrl+Shift+P` → "Tasks: Run Task" → "Stop All Processes"
