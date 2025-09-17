@echo off
echo 🚀 Starting RevEd Kids Backend in STAGING mode...

REM Set environment to staging
set NODE_ENV=staging

REM Copy staging environment file
copy env.staging .env

REM Start the application
npm run start:staging
