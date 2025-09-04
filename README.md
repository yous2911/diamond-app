# 💎 Diamond App - Educational Platform

A full-stack educational application for kids with a Node.js/Fastify backend and modern frontend. Features student progress tracking, exercise management, and GDPR-compliant data handling.

## 🚀 Features

### Core Features
- **Student Management** - Registration, profiles, and progress tracking
- **Exercise System** - Interactive exercises with multiple difficulty levels
- **Progress Analytics** - Detailed learning progress and statistics
- **Session Management** - Secure authentication and session handling

### Security & Compliance
- **GDPR Compliance** - Data export, deletion, and consent management
- **Audit Trail** - Comprehensive logging of all data operations  
- **Data Encryption** - Sensitive data protection
- **File Upload Security** - Secure file handling with validation
- **Input Sanitization** - XSS and injection prevention

### Technical Features
- **RESTful API** - Clean, documented REST endpoints
- **Database ORM** - Drizzle ORM with MySQL
- **Caching** - Redis integration for performance
- **Email Service** - Template-based email notifications
- **Image Processing** - Thumbnail generation and optimization

## 🏗️ Architecture

```
diamond-app/
├── backend/                 # Node.js/Fastify API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── db/            # Database schema and connection
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utility functions
│   │   └── tests/         # Test suites
│   └── package.json
├── frontend/               # React/Next.js frontend (TBD)
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: MySQL with Drizzle ORM
- **Caching**: Redis
- **Testing**: Vitest
- **Security**: Helmet, rate limiting, input validation
- **Email**: Nodemailer
- **File Processing**: Sharp (images)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Testing Framework**: Vitest
- **Process Manager**: PM2 (production)

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **MySQL** >= 8.0
- **Redis** >= 6.0 (optional, memory cache fallback)
- **npm** >= 8.0.0

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/yous2911/diamond-app.git
cd diamond-app/backend
npm install
```

### 2. Environment Setup
Create `.env` file in the backend directory:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/diamond_app"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_PATH="./uploads"

# Environment
NODE_ENV="development"
PORT=3000
```

### 3. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE diamond_app;"

# Run migrations (when available)
npm run db:migrate

# Seed initial data (when available)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- src/tests/security/
npm test -- src/tests/file-upload.test.ts
```

### Test Coverage
```bash
npm run test:coverage
```

### Current Test Status
- ✅ **10/21 test files passing** (248 passed / 180 failed tests)
- ✅ **Security tests** - All passing
- ✅ **Encryption tests** - All passing  
- ⚠️ **GDPR/Audit tests** - In progress
- ⚠️ **File upload tests** - Mostly working

## 📁 Project Structure

### Backend Services
- **AuthService** - Authentication and JWT handling
- **StudentService** - Student management operations
- **ExerciseService** - Exercise CRUD and logic
- **ProgressService** - Learning progress tracking
- **EmailService** - Template-based email sending
- **FileUploadService** - Secure file handling
- **GDPRService** - Data compliance operations
- **AuditTrailService** - Action logging and tracking
- **EncryptionService** - Data encryption/decryption

### Database Schema
- **students** - Student profiles and authentication
- **exercises** - Exercise content and metadata  
- **student_progress** - Learning progress tracking
- **sessions** - User session management
- **audit_logs** - Action audit trail
- **gdpr_consent_requests** - GDPR consent management
- **files** - File upload metadata

## 🔐 Security Features

- **Authentication**: JWT-based with secure session management
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries with ORM
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Anti-CSRF tokens
- **Rate Limiting**: API endpoint rate limiting
- **File Upload Security**: Type validation and virus scanning
- **Data Encryption**: Sensitive data encryption at rest

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Students
- `GET /api/students` - List students
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Exercises
- `GET /api/exercises` - List exercises
- `POST /api/exercises` - Create exercise
- `GET /api/exercises/:id` - Get exercise
- `PUT /api/exercises/:id` - Update exercise

### Progress
- `GET /api/progress/:studentId` - Get student progress
- `POST /api/progress` - Record progress
- `GET /api/progress/:studentId/stats` - Progress statistics

### GDPR
- `POST /api/gdpr/consent/submit` - Submit consent request
- `GET /api/gdpr/export/:studentId` - Export student data
- `POST /api/gdpr/request/submit` - Submit GDPR request

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Future)
```bash
docker build -t diamond-app .
docker run -p 3000:3000 diamond-app
```

### Environment Variables (Production)
Ensure all required environment variables are set:
- Database connection strings
- JWT secrets
- Email configuration
- File upload paths
- Redis configuration

## 🧩 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add some feature'`
6. Push to branch: `git push origin feature/your-feature`
7. Submit a Pull Request

### Code Style
- TypeScript with strict mode
- ESLint configuration included
- Prettier for code formatting
- Follow existing patterns and conventions

### Testing
- Write tests for new features
- Maintain test coverage above 80%
- Use descriptive test names
- Mock external dependencies

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core backend API
- ✅ Authentication system
- ✅ Basic student management
- ⚠️ Test suite completion

### Phase 2 (Next)
- 🔄 Frontend development
- 🔄 Advanced exercise types
- 🔄 Real-time progress tracking
- 🔄 Parent dashboard

### Phase 3 (Future)
- 📋 Mobile app
- 📋 Advanced analytics
- 📋 Gamification features
- 📋 Multi-language support

## 🐛 Known Issues

- Some GDPR API endpoints need frontend integration
- File upload validation needs refinement
- Audit trail service requires optimization
- Email template system needs completion

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test suites for examples

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ for educational excellence**