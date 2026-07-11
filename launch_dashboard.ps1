# Enable TLS 1.2/1.3 for downloads
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "STARTING TRADING DASHBOARD AUTO-LAUNCHER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$nodeDir = "$PSScriptRoot\node_portable"
$nodeExe = "$nodeDir\node.exe"

# 1. Check if Node.js portable is installed
if (!(Test-Path $nodeExe)) {
    Write-Host "[INFO] Node.js not found. Downloading portable package (v20)..." -ForegroundColor Yellow
    $zipUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip"
    $zipFile = "$PSScriptRoot\node.zip"
    
    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile
    } catch {
        Write-Host "[ERROR] Failed to download Node.js. Check your internet connection." -ForegroundColor Red
        Exit
    }
    
    Write-Host "[INFO] Extracting Node.js package..." -ForegroundColor Yellow
    $tempDir = "$PSScriptRoot\node_temp"
    Expand-Archive -Path $zipFile -DestinationPath $tempDir
    
    # Move core directory to portable folder
    Move-Item -Path "$tempDir\node-v20.11.0-win-x64" -Destination $nodeDir
    
    # Cleanup temp zip and folders
    Remove-Item -Path $zipFile -Force
    Remove-Item -Path $tempDir -Recurse -Force
    Write-Host "[SUCCESS] Portable Node.js installed!" -ForegroundColor Green
} else {
    Write-Host "[SUCCESS] Node.js portable already available." -ForegroundColor Green
}

# 2. Run npm install
Write-Host "[INFO] Installing project dependencies (Express and CORS)..." -ForegroundColor Yellow
$npmCmd = "$nodeDir\npm.cmd"
Start-Process -FilePath $npmCmd -ArgumentList "install" -WorkingDirectory $PSScriptRoot -Wait -NoNewWindow
Write-Host "[SUCCESS] Dependencies verified!" -ForegroundColor Green

# 3. Start local Node.js server
Write-Host "[INFO] Starting signal receiver server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath $nodeExe -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden
Write-Host "[SUCCESS] Server is running in the background on port 8080!" -ForegroundColor Green

# 4. Open Dashboard in Browser
Start-Process "http://localhost:8080"

# 5. Start SSH tunnel and output webhook URL
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "STARTING PUBLIC TUNNEL TO TRADINGVIEW (WITH FAILOVER)" -ForegroundColor Cyan
Write-Host "Please wait 5 seconds for the connection to establish." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Copy the URL printed below and paste it in TradingView:" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "[WARNING] DO NOT CLOSE THIS WINDOW or the tunnel will disconnect!" -ForegroundColor Red
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

# Double-failover SSH tunnel connection
Write-Host "[INFO] Trying Serveo tunnel..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 serveo.net

Write-Host "[INFO] Serveo disconnected. Trying localhost.run tunnel..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run
