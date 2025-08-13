# PowerShell script to start the backend from the correct directory
Write-Host "Starting backend from ChatbotApi directory..."
Set-Location "c:\repos\Sematic\ChatbotApi"
Write-Host "Current directory: $(Get-Location)"
dotnet run
