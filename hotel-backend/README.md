# 🏨 Hotel Management System - Backend

Node.js + TypeScript + MySQL backend for Hotel Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- MySQL 8.0+
- Docker & Docker Compose (optional)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

3. **Start with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Or start manually**
   ```bash
   # Start MySQL server first
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Data access layer
├── entities/        # Database entities
├── routes/          # API routes
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── app.ts           # Express app setup
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

## 🔗 API Endpoints

- **Health Check**: `GET /api/health`
- **Version**: `GET /api/version`

## 🐳 Docker

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker build -t hotel-backend .
docker run -p 3000:3000 hotel-backend
```

## 📊 Database

- **MySQL 8.0+**
- **TypeORM** for ORM
- **Migrations** for schema management

### Access Database
- **Adminer**: http://localhost:8080
- **Server**: db
- **Username**: hotel_user
- **Password**: hotel_password
- **Database**: hotel_management

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## 📝 Environment Variables

See `.env.example` for all available environment variables.

## 🔒 Security

- **Helmet** for security headers
- **CORS** properly configured
- **JWT** for authentication
- **bcrypt** for password hashing

## 📈 Monitoring

- **Winston** for logging
- **Health check** endpoint
- **Error tracking**

## 🚀 Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Start: `npm start`

## 📞 Support

For issues and questions, check the logs in `logs/` directory.

---

**Status**: ✅ Step 1 Complete - Infrastructure Setup