#!/bin/bash

echo "🚀 Deploying Diamond App Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create new project (if not exists)
echo "📦 Creating Railway project..."
railway project create diamond-backend

# Link to existing project (if you have one)
# railway link

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at: https://diamond-backend-production.up.railway.app"
