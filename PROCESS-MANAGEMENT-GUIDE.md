# Process Management Scripts

This directory contains scripts to easily stop all chatbot application processes.

## Available Scripts

### 1. PowerShell Script (Recommended)
```powershell
.\stop-all-processes.ps1
```
- **Most comprehensive** - stops all related processes
- **Port verification** - checks that ports are freed
- **Detailed output** - shows exactly what was stopped
- **Safe execution** - handles errors gracefully

### 2. Simple Batch File
```cmd
.\stop-all-processes-simple.bat
```
- **Quick and simple** - basic process termination
- **Windows compatible** - works on any Windows system
- **No PowerShell required** - runs in command prompt

## What Gets Stopped

These scripts will terminate:
- ✅ .NET Core processes (Backend API)
- ✅ Node.js processes (Frontend development server)
- ✅ npm processes (Package manager)
- ✅ Angular CLI processes
- ✅ Webpack processes
- ✅ Any processes using ports 7271, 4200, or 5204

## Usage Scenarios

**Before running tests:**
```powershell
.\stop-all-processes.ps1
```

**After development session:**
```powershell
.\stop-all-processes.ps1
```

**Quick cleanup:**
```cmd
.\stop-all-processes-simple.bat
```

## Troubleshooting

If processes won't stop:
1. Close VS Code completely
2. Run the script as Administrator
3. Restart your computer if needed

The PowerShell script will tell you exactly what was stopped and if any ports are still in use.
