# 🚀 RevEd Kids Backend - Staging Environment

## Overview

This staging environment provides a safe testing ground for your RevEd Kids application before production deployment. It includes a separate database, test data, and staging-specific configurations.

## 🎯 What's Included

### Database
- **Database Name**: `reved_kids_staging`
- **Test Data**: Pre-populated with sample students, competencies, and exercises
- **Staging Views**: Dashboard views for monitoring
- **Stored Procedures**: Data reset and test data generation
- **Audit Triggers**: Automatic logging of data changes

### Configuration
- **Environment File**: `env.staging`
- **Port**: 3004 (different from development)
- **Security**: Staging-specific JWT secrets and encryption keys
- **Rate Limiting**: More restrictive than development
- **Logging**: Enhanced debug logging

### Test Users
- **Student**: test.student@staging.com
- **Student**: staging.user@staging.com  
- **Admin**: admin@staging.com
- **Password**: (same as development for testing)

## 🛠️ Setup Instructions

### 1. Run the Setup Script

```bash
# Make sure you're in the backend directory
cd backend

# Run the staging setup
node setup-staging.js
```

### 2. Manual Database Setup (Alternative)

If the script fails, you can set up manually:

```bash
# Create the staging database
mysql -u root -p < setup-staging-database.sql
```

### 3. Verify Setup

```bash
# Test the staging database connection
mysql -u root -p -e "USE reved_kids_staging; SELECT COUNT(*) FROM students;"
```

## 🚀 Running Staging

### Option 1: Using npm scripts

```bash
# Start staging server
npm run start:staging

# Development mode with hot reload
npm run dev:staging

# Run tests against staging
npm run test:staging
```

### Option 2: Using startup scripts

```bash
# Unix/Linux/Mac
./start-staging.sh

# Windows
start-staging.bat
```

### Option 3: Manual start

```bash
# Copy staging environment
cp env.staging .env

# Set environment
export NODE_ENV=staging

# Start server
npm start
```

## 🌐 Accessing Staging

- **Backend API**: http://localhost:3004
- **Health Check**: http://localhost:3004/health
- **API Documentation**: http://localhost:3004/docs (if enabled)

## 📊 Staging Database Management

### Reset Staging Data

```sql
USE reved_kids_staging;
CALL ResetStagingData();
```

### Generate Test Progress Data

```sql
USE reved_kids_staging;
CALL GenerateTestProgress();
```

### View Staging Dashboard

```sql
USE reved_kids_staging;
SELECT * FROM staging_dashboard;
```

### Monitor Data Changes

```sql
USE reved_kids_staging;
SELECT * FROM gdprDataProcessingLog 
ORDER BY createdAt DESC 
LIMIT 10;
```

## 🔧 Staging-Specific Features

### Enhanced Logging
- All data changes are automatically logged
- Debug-level logging enabled
- Separate log files for staging

### Test Data Management
- Pre-populated with realistic test data
- Easy reset procedures
- Automated test data generation

### Security Features
- Staging-specific encryption keys
- Shorter session timeouts (12h vs 24h)
- More restrictive rate limiting
- Enhanced GDPR compliance logging

### Performance Monitoring
- Staging-specific metrics collection
- Reduced cache TTL for testing
- Lower connection limits

## 🧪 Testing in Staging

### 1. Authentication Testing

```bash
# Test login with staging users
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.student@staging.com","password":"your-password"}'
```

### 2. API Testing

```bash
# Test competencies endpoint
curl http://localhost:3004/api/competencies

# Test student progress
curl http://localhost:3004/api/students/1/progress
```

### 3. GDPR Testing

```bash
# Test data export
curl http://localhost:3004/api/gdpr/export/1

# Test data deletion
curl -X DELETE http://localhost:3004/api/gdpr/delete/1
```

## 🔍 Monitoring & Debugging

### Log Files
- **Application Logs**: `./logs/staging.log`
- **Error Logs**: `./logs/error.log`
- **Access Logs**: `./logs/access.log`

### Database Monitoring
```sql
-- Check recent activity
SELECT * FROM gdprDataProcessingLog 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Monitor student activity
SELECT s.prenom, s.nom, COUNT(sp.id) as exercises_attempted
FROM students s
LEFT JOIN studentProgress sp ON s.id = sp.studentId
GROUP BY s.id, s.prenom, s.nom;
```

### Performance Monitoring
```sql
-- Check database performance
SHOW PROCESSLIST;

-- Monitor slow queries
SHOW VARIABLES LIKE 'slow_query_log';
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL is running
   sudo systemctl status mysql
   
   # Test connection
   mysql -u root -p -e "SELECT 1;"
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using port 3004
   lsof -i :3004
   
   # Kill the process
   kill -9 <PID>
   ```

3. **Environment File Issues**
   ```bash
   # Verify staging environment file
   cat env.staging
   
   # Check if .env exists
   ls -la .env
   ```

### Reset Everything

```bash
# Stop staging server
pkill -f "node.*staging"

# Reset database
mysql -u root -p -e "DROP DATABASE IF EXISTS reved_kids_staging;"
mysql -u root -p < setup-staging-database.sql

# Restart staging
npm run start:staging
```

## 📋 Staging Checklist

Before deploying to production, ensure:

- [ ] All staging tests pass
- [ ] Authentication works correctly
- [ ] GDPR compliance features tested
- [ ] Performance is acceptable
- [ ] Security features are working
- [ ] Database operations are stable
- [ ] Error handling is robust
- [ ] Logging is comprehensive

## 🔄 Staging to Production

When ready to deploy to production:

1. **Backup staging data** (if needed for reference)
2. **Update production environment variables**
3. **Run production database migrations**
4. **Deploy application code**
5. **Verify production deployment**
6. **Monitor production logs**

## 📞 Support

If you encounter issues with the staging environment:

1. Check the logs in `./logs/staging.log`
2. Verify database connectivity
3. Ensure all environment variables are set
4. Review the troubleshooting section above

---

**Happy Testing! 🎉**

Your staging environment is now ready for comprehensive testing before production deployment.









