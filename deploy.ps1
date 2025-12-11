# 🚀 DIAMOND APP - Quick Deployment Script
# This script helps you deploy and see what works/breaks

Write-Host "🚀 DIAMOND APP Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if env.backend exists
$envFile = "backend\env.backend"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  env.backend not found!" -ForegroundColor Yellow
    Write-Host "Creating from example..." -ForegroundColor Yellow
    
    if (Test-Path "backend\env.backend.example") {
        Copy-Item "backend\env.backend.example" $envFile
        Write-Host "✅ Created env.backend from example" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Edit backend\env.backend and set:" -ForegroundColor Yellow
        Write-Host "   - DB_PASSWORD (your MySQL password)" -ForegroundColor Yellow
        Write-Host "   - JWT_SECRET (generate with: openssl rand -hex 32)" -ForegroundColor Yellow
        Write-Host "   - JWT_REFRESH_SECRET (generate with: openssl rand -hex 32)" -ForegroundColor Yellow
        Write-Host "   - ENCRYPTION_KEY (must be exactly 32 characters)" -ForegroundColor Yellow
        Write-Host "   - COOKIE_SECRET (generate with: openssl rand -hex 32)" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Press Enter after editing env.backend, or Ctrl+C to cancel"
    } else {
        Write-Host "❌ env.backend.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js >= 18.0.0" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Check MySQL connection (optional)
Write-Host ""
Write-Host "Checking MySQL connection..." -ForegroundColor Cyan
Write-Host "⚠️  Make sure MySQL is running!" -ForegroundColor Yellow

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
Write-Host ""

# Backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend npm install failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend npm install failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Ask what to start
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "What would you like to start?" -ForegroundColor Cyan
Write-Host "1. Backend only (port 3003)" -ForegroundColor White
Write-Host "2. Frontend only (port 3000)" -ForegroundColor White
Write-Host "3. Both (backend + frontend)" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1-4)"

Set-Location ..

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Starting Backend..." -ForegroundColor Cyan
        Set-Location backend
        Write-Host "Backend will run on http://localhost:3003" -ForegroundColor Yellow
        Write-Host "Health check: http://localhost:3003/api/health" -ForegroundColor Yellow
        Write-Host ""
        npm run dev
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Starting Frontend..." -ForegroundColor Cyan
        Set-Location frontend
        Write-Host "Frontend will run on http://localhost:3000" -ForegroundColor Yellow
        Write-Host ""
        npm start
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 Starting Both Backend and Frontend..." -ForegroundColor Cyan
        Write-Host ""
        
        # Start backend in background
        Write-Host "Starting backend..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev" -WindowStyle Normal
        
        Start-Sleep -Seconds 3
        
        # Start frontend
        Write-Host "Starting frontend..." -ForegroundColor Yellow
        Set-Location frontend
        Write-Host ""
        Write-Host "Backend: http://localhost:3003" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
        Write-Host ""
        npm start
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
        exit 1
    }
}








