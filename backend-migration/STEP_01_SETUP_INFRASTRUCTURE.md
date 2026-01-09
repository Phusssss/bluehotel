# 🏗️ STEP 1: SETUP & INFRASTRUCTURE (Weeks 1-2)

## I. OVERVIEW

**Duration**: 2 weeks  
**Team**: 1 Backend Lead + 1 DevOps Engineer  
**Goal**: Setup complete development environment and project foundation

---

## II. TASKS CHECKLIST

### Week 1: Project Setup
- [ ] Create Node.js project structure
- [ ] Configure TypeScript
- [ ] Setup Express.js framework
- [ ] Configure environment variables
- [ ] Setup basic logging
- [ ] Create project documentation

### Week 2: Database & Docker
- [ ] Setup MySQL database
- [ ] Create database migrations
- [ ] Configure Docker & Docker Compose
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure error handling & monitoring
- [ ] Create health check endpoints

---

## III. PROJECT STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # Database connection
│   │   ├── env.ts              # Environment variables
│   │   └── logger.ts           # Logger setup
│   │
│   ├── controllers/            # Request handlers (empty for now)
│   ├── services/               # Business logic (empty for now)
│   ├── repositories/           # Data access (empty for now)
│   ├── entities/               # Database entities (empty for now)
│   ├── routes/                 # API routes
│   │   └── index.ts            # Main router
│   │
│   ├── middleware/             # Express middleware
│   │   ├── error.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── utils/                  # Utility functions
│   │   └── errors.ts           # Custom errors
│   │
│   └── app.ts                  # Express app
│
├── migrations/                 # Database migrations
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── eslint.config.js
└── server.ts                   # Entry point
```

---

## IV. TECHNOLOGY STACK

### Core Dependencies
```json
{
  "express": "^4.18.x",
  "typescript": "^5.x",
  "typeorm": "^0.3.x",
  "mysql2": "^3.x",
  "dotenv": "^16.x",
  "cors": "^2.8.x",
  "helmet": "^7.x",
  "winston": "^3.x"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20.x",
  "@types/express": "^4.x",
  "@types/cors": "^2.x",
  "ts-node": "^10.x",
  "nodemon": "^3.x",
  "eslint": "^8.x",
  "@typescript-eslint/parser": "^6.x",
  "@typescript-eslint/eslint-plugin": "^6.x"
}
```

---

## V. IMPLEMENTATION DETAILS

### 1. Package.json Setup
```json
{
  "name": "hotel-backend",
  "version": "1.0.0",
  "description": "Hotel Management System Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate",
    "migration:run": "typeorm-ts-node-commonjs migration:run",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert"
  }
}
```

### 2. TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Environment Variables
```bash
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=hotel_user
DATABASE_PASSWORD=hotel_password
DATABASE_NAME=hotel_management

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Database Configuration
```typescript
// src/config/database.ts
import { DataSource } from 'typeorm';
import { config } from './env';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  entities: ['src/entities/**/*.ts'],
  migrations: ['migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});
```

### 5. Logger Configuration
```typescript
// src/config/logger.ts
import winston from 'winston';
import { config } from './env';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hotel-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 6. Express App Setup
```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { logger } from './config/logger';
import { errorMiddleware } from './middleware/error.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(loggerMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(errorMiddleware);

export default app;
```

---

## VI. DOCKER SETUP

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_HOST=db
      - DATABASE_PORT=3306
      - DATABASE_USERNAME=hotel_user
      - DATABASE_PASSWORD=hotel_password
      - DATABASE_NAME=hotel_management
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=hotel_management
      - MYSQL_USER=hotel_user
      - MYSQL_PASSWORD=hotel_password
    volumes:
      - db_data:/var/lib/mysql
      - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  db_data:
```

---

## VII. SUCCESS CRITERIA

- [ ] Project builds without errors
- [ ] Docker containers start successfully
- [ ] Database connection established
- [ ] Health check endpoint responds
- [ ] CI/CD pipeline passes
- [ ] Logging works correctly
- [ ] Environment variables loaded
- [ ] TypeScript compilation successful

---

## VIII. NEXT STEPS

After completing this step:
1. Move to **STEP 2: Authentication & Users**
2. Begin implementing JWT authentication
3. Create user management APIs
4. Setup role-based access control