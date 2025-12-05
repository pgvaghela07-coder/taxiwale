# MongoDB Download Script for Windows
Write-Host "`n📦 MongoDB Community Server Downloader" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$downloadUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-latest.msi"
$downloadPath = "$env:USERPROFILE\Downloads\mongodb-windows-installer.msi"

Write-Host "`n📥 Downloading MongoDB Community Server..." -ForegroundColor Yellow
Write-Host "   URL: $downloadUrl" -ForegroundColor Gray
Write-Host "   Save to: $downloadPath" -ForegroundColor Gray

try {
    # Download MongoDB installer
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    
    Write-Host "`n✅ Download Complete!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Run the installer: $downloadPath" -ForegroundColor White
    Write-Host "   2. Choose 'Complete' installation" -ForegroundColor White
    Write-Host "   3. Check 'Install MongoDB as a Service'" -ForegroundColor White
    Write-Host "   4. After installation, start MongoDB:" -ForegroundColor White
    Write-Host "      net start MongoDB" -ForegroundColor Yellow
    Write-Host "`n💡 Alternative: Use MongoDB Atlas (Cloud) - See MONGODB_SETUP.md" -ForegroundColor Cyan
    
    # Ask if user wants to open the installer
    $response = Read-Host "`nOpen installer now? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-Process $downloadPath
    }
} catch {
    Write-Host "`n❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Alternative: Use MongoDB Atlas (Cloud) - See MONGODB_SETUP.md" -ForegroundColor Yellow
    Write-Host "   Or download manually from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
}

