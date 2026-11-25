Set-MpPreference -DisableRealtimeMonitoring $true
Write-Host 'RT_DISABLED'
Set-Location 'E:\ATSA-Project-main\ATSA-Project-main'
$env:PATH = "E:\ATSA-Project-main\ATSA-Project-main\node_modules\.bin;" + $env:PATH
& "E:\ATSA-Project-main\ATSA-Project-main\node_modules\.bin\vite.cmd" build *> 'C:\Users\PC\AppData\Local\Temp\build9.log'
$rc = $LASTEXITCODE
Set-MpPreference -DisableRealtimeMonitoring $false
Write-Host "BUILD_EXIT=$rc"
Write-Host 'RT_REENABLED'
