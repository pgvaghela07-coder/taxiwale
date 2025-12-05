# MongoDB Atlas Setup Helper Script
Write-Host "`n🚀 MongoDB Atlas Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n📋 This script will help you configure MongoDB Atlas" -ForegroundColor Yellow
Write-Host "`nStep 1: Opening MongoDB Atlas signup page..." -ForegroundColor Green
Start-Process "https://www.mongodb.com/cloud/atlas/register"

Write-Host "`n⏳ Waiting for you to complete signup and cluster creation..." -ForegroundColor Yellow
Write-Host "   (This usually takes 5-10 minutes)" -ForegroundColor Gray

$continue = Read-Host "`nPress Enter when you have your connection string ready"

Write-Host "`n📝 Enter your MongoDB Atlas connection string:" -ForegroundColor Cyan
Write-Host "   Format: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taxiwale?retryWrites=true&w=majority" -ForegroundColor Gray
$connectionString = Read-Host "`nConnection String"

if ($connectionString) {
    # Read current .env file
    $envPath = Join-Path $PSScriptRoot ".env"
    $envContent = @"
PORT=5000
NODE_ENV=development
MONGODB_URI=$connectionString
JWT_SECRET=taxiwale-super-secret-jwt-key-for-development-only-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
"@
    
    # Write to .env file
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -Force
    
    Write-Host "`n✅ .env file updated successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart your backend server" -ForegroundColor White
    Write-Host "   2. Check the server logs for connection status" -ForegroundColor White
    Write-Host "   3. You should see: '✅ MongoDB Connected: ...'" -ForegroundColor White
    
    # Test connection
    Write-Host "`n🧪 Testing connection..." -ForegroundColor Yellow
    $testScript = @"
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.error('\n💡 Check:');
    console.error('   1. Username and password are correct');
    console.error('   2. IP address is allowed in Network Access');
    console.error('   3. Connection string format is correct');
    process.exit(1);
  });
"@
    
    $testScript | Out-File -FilePath "$env:TEMP\test-mongo.js" -Encoding utf8
    Push-Location $PSScriptRoot
    node "$env:TEMP\test-mongo.js"
    Pop-Location
    Remove-Item "$env:TEMP\test-mongo.js" -ErrorAction SilentlyContinue
    
} else {
    Write-Host "`n❌ No connection string provided. Setup cancelled." -ForegroundColor Red
    Write-Host "`n💡 You can manually update backend/.env file with your connection string." -ForegroundColor Yellow
}

Write-Host "`n📖 For detailed instructions, see: ATLAS_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

