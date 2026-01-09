# 🐳 HOTEL MANAGEMENT - DOCKER COMPLETE SETUP

## I. OVERVIEW - TỔNG QUAN

Hệ thống khách sạn hoàn chỉnh chạy trên **Docker** với một lệnh duy nhất:

```bash
docker-compose up -d
```

### Kiến trúc
```
┌─────────────────────────────────────────────────┐
│          CLIENT BROWSER (localhost:3000)        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐      ┌─────────────────┐     │
│  │   Frontend   │◄────►│   Backend API   │     │
│  │  (React)     │      │  (Node.js:3001) │     │
│  │  :3000       │      │                 │     │
│  └──────────────┘      └────────┬────────┘     │
│                                 │              │
│                         ┌───────▼────────┐     │
│                         │     MySQL      │     │
│                         │   Database     │     │
│                         │   :3306        │     │
│                         └────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## II. CHUẨN BỊ

### A. Yêu cầu
```
✅ Docker Desktop (Windows / macOS) hoặc Docker Engine (Linux)
✅ Docker Compose v2.0+
✅ 4GB RAM tối thiểu
✅ 10GB dung lượng ổ đĩa
✅ Port 3000, 3001, 3306 trống
```

**Cài đặt:**
- Windows/Mac: Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux: `sudo apt-get install docker-ce docker-compose`

### B. Kiểm tra cài đặt
```bash
docker --version
docker-compose --version
```

---

## III. PROJECT STRUCTURE - CẤU TRÚC DỰ ÁN

```
hotel-management/
├── frontend/                    # React app
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile.frontend      # Frontend Docker image
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── hotel-backend/               # Node.js backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   └── routes/
│   ├── docker/
│   │   └── mysql/
│   │       └── init.sql         # Initial database schema
│   ├── Dockerfile               # Backend Docker image
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local               # Backend environment
│
├── docker-compose.yml           # Main Docker setup file
├── .env.production              # Production environment
├── .env.local                   # Development environment
└── README.md
```

---

## IV. DOCKER COMPOSE CONFIGURATION

### A. docker-compose.yml (Hoàn chỉnh)

```yaml
version: '3.8'

services:
  # ==================== MYSQL DATABASE ====================
  mysql:
    image: mysql:8.0
    container_name: hotel-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root_password}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-hotel_management}
      MYSQL_USER: ${MYSQL_USER:-hotel_user}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-hotel_password}
    ports:
      - "3306:3306"
    volumes:
      # Persist database data
      - mysql_data:/var/lib/mysql
      # Initial schema
      - ./hotel-backend/docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
      # Custom MySQL config
      - ./hotel-backend/docker/mysql/my.cnf:/etc/mysql/conf.d/my.cnf
    networks:
      - hotel-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
      interval: 10s

  # ==================== BACKEND API ====================
  backend:
    build:
      context: ./hotel-backend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: hotel-backend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
      DATABASE_HOST: mysql
      DATABASE_PORT: 3306
      DATABASE_USERNAME: ${MYSQL_USER:-hotel_user}
      DATABASE_PASSWORD: ${MYSQL_PASSWORD:-hotel_password}
      DATABASE_NAME: ${MYSQL_DATABASE:-hotel_management}
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-this}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-your-super-secret-refresh-key-change-this}
      JWT_EXPIRE: 24h
      JWT_REFRESH_EXPIRE: 7d
      CORS_ORIGIN: http://localhost:3000
      LOG_LEVEL: info
    ports:
      - "3001:3000"
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - hotel-network
    volumes:
      # Logs volume
      - ./hotel-backend/logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      timeout: 10s
      retries: 5
      interval: 30s

  # ==================== FRONTEND ====================
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: hotel-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      VITE_API_URL: http://localhost:3001
      VITE_SOCKET_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - hotel-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      timeout: 10s
      retries: 5
      interval: 30s

  # ==================== REDIS (Optional - Caching) ====================
  redis:
    image: redis:7-alpine
    container_name: hotel-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - hotel-network
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      timeout: 10s
      retries: 5
      interval: 30s

networks:
  hotel-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
```

---

## V. ENVIRONMENT FILES

### A. .env.local (Development)

```env
# ==================== NODE ====================
NODE_ENV=development
PORT=3000

# ==================== DATABASE ====================
MYSQL_ROOT_PASSWORD=root_password
MYSQL_USER=hotel_user
MYSQL_PASSWORD=hotel_password
MYSQL_DATABASE=hotel_management
DATABASE_HOST=mysql
DATABASE_PORT=3306

# ==================== JWT ====================
JWT_SECRET=dev-secret-key-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# ==================== CORS ====================
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ==================== LOGGING ====================
LOG_LEVEL=debug

# ==================== FRONTEND ====================
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### B. .env.production (Production)

```env
# ==================== NODE ====================
NODE_ENV=production
PORT=3000

# ==================== DATABASE ====================
MYSQL_ROOT_PASSWORD=CHANGE_THIS_IN_PRODUCTION
MYSQL_USER=hotel_user
MYSQL_PASSWORD=CHANGE_THIS_IN_PRODUCTION
MYSQL_DATABASE=hotel_management_prod
DATABASE_HOST=mysql
DATABASE_PORT=3306

# ==================== JWT ====================
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION_LONG_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_IN_PRODUCTION_LONG_RANDOM_STRING
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# ==================== CORS ====================
CORS_ORIGIN=https://yourdomain.com

# ==================== LOGGING ====================
LOG_LEVEL=info

# ==================== FRONTEND ====================
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

---

## VI. DOCKERFILE CONFIGURATIONS

### A. Backend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]
```

### B. Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## VII. QUICK START - BẮT ĐẦU NHANH

### A. 1️⃣ Khởi động toàn bộ hệ thống

```bash
# Bước 1: Di chuyển vào thư mục project
cd /path/to/hotel-management

# Bước 2: Chạy Docker Compose
docker-compose up -d

# Bước 3: Kiểm tra trạng thái
docker-compose ps

# Kết quả mong đợi:
# NAME              STATUS
# hotel-mysql       Up (healthy)
# hotel-backend     Up (healthy)
# hotel-frontend    Up (healthy)
# hotel-redis       Up (healthy)
```

### B. Truy cập ứng dụng

```
Frontend:  http://localhost:3000
Backend:   http://localhost:3001
MySQL:     localhost:3306 (Thông qua Docker)
Redis:     localhost:6379 (Thông qua Docker)
```

### C. 🛑 Dừng hệ thống

```bash
# Dừng tất cả containers
docker-compose down

# Dừng và xóa volumes (Reset database)
docker-compose down -v

# Dừng mà giữ lại dữ liệu
docker-compose stop
```

---

## VIII. MANAGEMENT COMMANDS

### A. Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Chỉ backend
docker-compose logs -f backend

# Chỉ frontend
docker-compose logs -f frontend

# Chỉ database
docker-compose logs -f mysql

# 100 dòng cuối
docker-compose logs --tail=100 backend
```

### B. Chạy lệnh bên trong container

```bash
# Backend - Database migration
docker-compose exec backend npm run migration:run

# Backend - Database seed
docker-compose exec backend npm run seed

# Backend - Run tests
docker-compose exec backend npm test

# MySQL - Truy cập database shell
docker-compose exec mysql mysql -u hotel_user -photel_password hotel_management

# Frontend - Install packages
docker-compose exec frontend npm install
```

### C. Rebuild images

```bash
# Rebuild tất cả
docker-compose build

# Rebuild chỉ backend
docker-compose build backend

# Rebuild và khởi động lại
docker-compose up -d --build

# Remove old images
docker image prune -a
```

### D. Health check

```bash
# Kiểm tra trạng thái
docker-compose ps

# Chi tiết container
docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

# Test backend API
curl -X GET http://localhost:3001/health

# Test frontend
curl -X GET http://localhost:3000
```

---

## IX. DATABASE MANAGEMENT

### A. Initial Database Setup

File: `hotel-backend/docker/mysql/init.sql`

```sql
-- Create database and user
CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('admin', 'manager', 'receptionist', 'housekeeper', 'maintenance', 'staff') DEFAULT 'staff',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
);

-- Rooms table
CREATE TABLE rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  floor INT,
  status ENUM('available', 'occupied', 'dirty', 'cleaning', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_number (room_number),
  INDEX idx_status (status),
  INDEX idx_floor (floor)
);

-- Guests table
CREATE TABLE guests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
);

-- Reservations table
CREATE TABLE reservations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guest_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  total_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  INDEX idx_status (status),
  INDEX idx_dates (check_in_date, check_out_date),
  INDEX idx_guest_id (guest_id),
  INDEX idx_room_id (room_id)
);

-- Create initial admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES ('admin@hotel.local', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'admin', 'active');
```

### B. Backup & Restore Database

```bash
# Backup
docker-compose exec mysql mysqldump -u hotel_user -photel_password hotel_management > backup.sql

# Restore
docker-compose exec -T mysql mysql -u hotel_user -photel_password hotel_management < backup.sql

# Auto backup (cron job)
# 0 2 * * * /path/to/backup.sh
```

---

## X. DEVELOPMENT WORKFLOW

### A. Thay đổi Code + Auto Reload

```bash
# Terminal 1: Theo dõi logs
docker-compose logs -f backend

# Terminal 2: Code bình thường trong IDE
# Khi lưu file, backend tự động reload (nếu nodemon configured)
```

### B. Update Dependencies

```bash
# Backend
docker-compose exec backend npm install <package-name>

# Frontend
docker-compose exec frontend npm install <package-name>

# Rebuild images
docker-compose up -d --build
```

### C. Database Migrations

```bash
# Generate migration
docker-compose exec backend npm run migration:generate

# Run migration
docker-compose exec backend npm run migration:run

# Revert migration
docker-compose exec backend npm run migration:revert
```

---

## XI. PRODUCTION DEPLOYMENT

### A. Pre-deployment Checklist

```
☐ Change all secrets in .env.production
☐ Update CORS_ORIGIN to your domain
☐ Update VITE_API_URL to your API domain
☐ Enable HTTPS/SSL certificates
☐ Setup database backups
☐ Setup monitoring (New Relic, DataDog)
☐ Setup logging aggregation (ELK, Loggly)
☐ Test all APIs in staging
☐ Load testing
```

### B. Docker Production Deployment

**Option 1: Single VPS**

```bash
# 1. SSH vào server
ssh root@your-server-ip

# 2. Clone repository
git clone <your-repo> hotel-management
cd hotel-management

# 3. Setup environment
cp .env.production.example .env.production
# Edit .env.production với values thực tế

# 4. Khởi động
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Setup SSL (Let's Encrypt)
# Sử dụng nginx reverse proxy hoặc certbot
```

**Option 2: Docker Swarm**

```bash
# Initialize swarm
docker swarm init

# Deploy
docker stack deploy -c docker-compose.yml hotel-management

# Check status
docker stack ps hotel-management
```

**Option 3: Kubernetes**

```bash
# Tạo namespaces
kubectl create namespace hotel-management

# Deploy
kubectl apply -f k8s/mysql-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check status
kubectl get pods -n hotel-management
```

### C. Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Load balancing (Nginx)
# Cấu hình nginx upstream với 3 backend instances
```

---

## XII. TROUBLESHOOTING

### A. Container won't start

```bash
# Check logs
docker-compose logs <service-name>

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Remove container
docker-compose rm <service-name>
docker-compose up -d
```

### B. Database connection error

```bash
# Check MySQL status
docker-compose exec mysql mysqladmin -u root -proot_password ping

# Check backend health
curl http://localhost:3001/health

# Restart MySQL
docker-compose restart mysql
docker-compose restart backend
```

### C. Port already in use

```bash
# Find process using port
lsof -i :3000        # Frontend
lsof -i :3001        # Backend
lsof -i :3306        # MySQL

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### D. Memory/Performance issues

```bash
# Check resource usage
docker stats

# Limit resources
docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### E. Database locked

```bash
# Check tables
docker-compose exec mysql mysql -u hotel_user -photel_password -e "SHOW PROCESSLIST;"

# Kill connection
docker-compose exec mysql mysql -u hotel_user -photel_password -e "KILL <PROCESS_ID>;"
```

---

## XIII. MONITORING & LOGGING

### A. Real-time Monitoring

```bash
# All containers
watch -n 2 'docker-compose ps'

# Resource usage
docker stats

# Network inspection
docker network inspect hotel-network
```

### B. Centralized Logging

Setup ELK Stack (Elasticsearch + Logstash + Kibana):

```yaml
# Add to docker-compose.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
```

### C. Health Checks

```bash
# Frontend health
curl -X GET http://localhost:3000

# Backend health
curl -X GET http://localhost:3001/health

# Database health
docker-compose exec mysql mysqladmin -u hotel_user -photel_password ping
```

---

## XIV. SECURITY BEST PRACTICES

### A. Image Security

```bash
# Scan images for vulnerabilities
trivy image hotel-management:latest

# Use minimal base images
FROM node:18-alpine (not node:18)

# Don't run as root
USER nodejs
```

### B. Environment Variables

```bash
# Use .env files (not in Dockerfile)
# Use secrets for production
docker secret create jwt_secret -

# Reference in docker-compose
docker-compose.yml:
services:
  backend:
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

### C. Network Security

```yaml
# Isolate networks
networks:
  hotel-network:
    driver: bridge

# Services không cần public không publish ports
services:
  mysql:
    # NO ports (chỉ internal communication)
```

### D. Data Protection

```bash
# Encrypt MySQL connection
# Use SSL certificates
# Regular backups
docker-compose exec mysql mysqldump ... | gzip > backup.sql.gz
```

---

## XV. QUICK COMMANDS REFERENCE

```bash
# ==================== START/STOP ====================
docker-compose up -d                    # Start all
docker-compose down                     # Stop all
docker-compose stop                     # Stop (keep data)
docker-compose start                    # Resume
docker-compose restart <service>        # Restart service

# ==================== BUILD ====================
docker-compose build                    # Build images
docker-compose build --no-cache         # Rebuild from scratch
docker-compose up -d --build            # Build and start

# ==================== LOGS ====================
docker-compose logs -f                  # All logs (follow)
docker-compose logs -f <service>        # Service logs
docker-compose logs --tail=100 <svc>    # Last 100 lines

# ==================== EXEC ====================
docker-compose exec <svc> <cmd>         # Run command
docker-compose exec backend sh           # Interactive shell
docker-compose exec mysql bash           # Database shell

# ==================== INFO ====================
docker-compose ps                       # Status
docker stats                            # Resources
docker-compose config                   # View configuration

# ==================== CLEAN UP ====================
docker-compose down -v                  # Stop and remove volumes
docker image prune -a                   # Remove unused images
docker volume prune                     # Remove unused volumes
```

---

## XVI. EXAMPLE: COMPLETE DEPLOYMENT FLOW

```bash
# 1️⃣ Clone repository
git clone https://github.com/yourname/hotel-management.git
cd hotel-management

# 2️⃣ Setup environment
cp .env.local .env
nano .env  # Edit if needed

# 3️⃣ Build images
docker-compose build

# 4️⃣ Start services
docker-compose up -d

# 5️⃣ Wait for healthy status
sleep 30
docker-compose ps

# 6️⃣ Run migrations
docker-compose exec backend npm run migration:run

# 7️⃣ Seed data (optional)
docker-compose exec backend npm run seed

# 8️⃣ Check health
curl http://localhost:3001/health
curl http://localhost:3000

# 9️⃣ View logs
docker-compose logs -f

# 🔟 Access application
# Open browser: http://localhost:3000
```

---

## XVII. SUCCESS CHECKLIST ✅

After running `docker-compose up -d`:

```
☐ Docker Desktop running
☐ All 4 containers show "Up" status
☐ All containers show "healthy" in health check
☐ Frontend accessible at http://localhost:3000
☐ Backend API accessible at http://localhost:3001/health
☐ MySQL accessible at localhost:3306
☐ Redis accessible at localhost:6379
☐ Logs show no errors
☐ Can login to frontend
☐ Can access database via tools (MySQL Workbench, DBeaver)
☐ Network connectivity between containers working
☐ No port conflicts (lsof -i)
```

---

## XVIII. NEXT STEPS

1. **Update .env files** with actual secrets
2. **Test locally** with docker-compose
3. **Deploy to staging** for QA testing
4. **Setup monitoring** (New Relic, DataDog)
5. **Configure backups** (daily MySQL dumps)
6. **Setup CI/CD** (GitHub Actions → Docker Hub → Server)
7. **Monitor performance** and optimize
8. **Go live!** 🚀

---

## 🎉 DONE!

One command to rule them all:
```bash
docker-compose up -d
```

That's it! Your entire hotel management system is running. 🐳✨

---

**Questions?** Check logs:
```bash
docker-compose logs -f
```

**Need help?** Read the full documentation or contact support.
