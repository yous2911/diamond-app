#!/bin/bash
# Staging Environment Startup Script

echo "🚀 Starting RevEd Kids Backend in STAGING mode..."

# Set environment to staging
export NODE_ENV=staging

# Copy staging environment file
cp env.staging .env

# Start the application
npm run start:staging
