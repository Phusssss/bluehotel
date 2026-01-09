# 🚀 HOW TO USE DOCKER - GETTING STARTED

## 📋 Files Created

```
✅ DOCKER_COMPLETE_SETUP.md         (23.80 KB) - Full documentation
✅ DOCKER_QUICK_START.md             (11.52 KB) - Quick reference
✅ docker-startup.sh                 (2.41 KB)  - Linux/Mac startup script
✅ docker-startup.bat                (2.67 KB)  - Windows startup script
✅ docker-compose.yml                (existing) - Container orchestration
✅ Dockerfile (backend)              (existing) - Backend image
✅ Dockerfile.frontend               (existing) - Frontend image
```

---

## 🎯 YOUR MISSION

**Goal:** Run entire hotel management system (backend + frontend + database) with ONE command

**Current Status:** ✅ All files prepared

**What to do next:** Choose your OS and follow the steps

---

## 🖥️ WINDOWS USERS

### Step 1: Open PowerShell
```
Press: Windows + R
Type:  powershell
Click: OK
```

### Step 2: Go to project folder
```powershell
cd "E:\MB\BlueHT\hotel-management"
```

### Step 3: Check Docker is running
```powershell
docker ps
```
If you see a list of containers (or empty table), Docker is running ✅

If error, **start Docker Desktop** first

### Step 4: Run the startup script
```powershell
.\docker-startup.bat
```

### Step 5: Wait for "STARTUP COMPLETE!"
```
✅ STARTUP COMPLETE!

📍 Access your application:
   Frontend:  http://localhost:3000
   Backend:   http://localhost:3001
```

### Step 6: Open browser
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/health

---

## 🐧 MAC/LINUX USERS

### Step 1: Open Terminal

### Step 2: Go to project folder
```bash
cd /path/to/hotel-management
```

### Step 3: Check Docker is running
```bash
docker ps
```

### Step 4: Make script executable
```bash
chmod +x docker-startup.sh
```

### Step 5: Run the startup script
```bash
./docker-startup.sh
```

### Step 6: Wait for "STARTUP COMPLETE!"

### Step 7: Open browser
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/health

---

## 🚀 MANUAL METHOD (All OS)

If scripts don't work:

```bash
# 1. Go to project folder
cd hotel-management

# 2. Start everything
docker-compose up -d

# 3. Wait 10 seconds

# 4. Check status
docker-compose ps

# 5. Open browser
# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001
```

---

## ✅ SUCCESS CHECKLIST

After startup, you should see:

```
docker-compose ps

NAME                STATUS              PORTS
hotel-mysql         Up (healthy)        0.0.0.0:3306->3306/tcp
hotel-backend       Up (healthy)        0.0.0.0:3001->3000/tcp
hotel-frontend      Up (healthy)        0.0.0.0:3000->3000/tcp
hotel-redis         Up (healthy)        0.0.0.0:6379->6379/tcp
```

**All should say "Up (healthy)" ✅**

---

## 🌐 ACCESS YOUR APPLICATION

| Application | URL | Username | Password |
|---|---|---|---|
| Frontend | http://localhost:3000 | admin@hotel.local | (from seed data) |
| Backend API | http://localhost:3001 | - | - |
| API Health | http://localhost:3001/health | - | - |

---

## 📊 DATABASE ACCESS

Want to access database directly?

### Using MySQL client:
```bash
docker-compose exec mysql mysql -u hotel_user -photel_password hotel_management
```

### Using GUI tools:
1. Download [DBeaver](https://dbeaver.io/) or [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
2. Create new connection:
   - Host: `localhost`
   - Port: `3306`
   - User: `hotel_user`
   - Password: `hotel_password`
   - Database: `hotel_management`

---

## 📖 DOCUMENTATION

### Quick Reference
👉 **Read this first:** [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)
- Common commands
- Troubleshooting
- Daily tasks

### Complete Guide
👉 **For deep dive:** [DOCKER_COMPLETE_SETUP.md](DOCKER_COMPLETE_SETUP.md)
- Full architecture
- Production deployment
- Security
- Monitoring
- Performance tuning

---

## 🛑 STOP THE SYSTEM

When done, stop everything:

```bash
docker-compose down
```

To keep database:
```bash
docker-compose stop
docker-compose start  # Later to resume
```

To delete everything (reset):
```bash
docker-compose down -v
```

---

## 🐛 TROUBLESHOOTING

### Q: Port 3000 already in use
```bash
# Kill process using port 3000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Mac/Linux:
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Q: Docker container won't start
```bash
# Check error
docker-compose logs backend

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Q: Can't connect to database
```bash
# Check MySQL is healthy
docker-compose exec mysql mysqladmin -u hotel_user -photel_password ping

# Restart it
docker-compose restart mysql
```

### Q: Frontend stuck on loading
```bash
# Check logs
docker-compose logs frontend

# Clear cache and rebuild
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Q: Out of memory
```bash
# Check resource usage
docker stats

# Your computer might be low on RAM
# Close other applications or add more RAM
```

---

## 📝 USEFUL COMMANDS

```bash
# View real-time logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Check service status
docker-compose ps

# Run database migrations
docker-compose exec backend npm run migration:run

# Run database seeds
docker-compose exec backend npm run seed

# Run tests
docker-compose exec backend npm test

# Access backend shell
docker-compose exec backend sh

# Restart a service
docker-compose restart backend

# Rebuild without cache
docker-compose build --no-cache

# Monitor resource usage
docker stats
```

---

## 🎯 NEXT STEPS

1. ✅ **Run the system** - Use `docker-compose up -d`

2. ✅ **Access frontend** - http://localhost:3000

3. ✅ **Read docs** - Open [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)

4. ✅ **Start development** - Make code changes, containers auto-reload

5. ✅ **For production** - Read [DOCKER_COMPLETE_SETUP.md](DOCKER_COMPLETE_SETUP.md#xi-production-deployment)

---

## 🎉 THAT'S IT!

You now have:
- ✅ Frontend (React) on port 3000
- ✅ Backend (Node.js) on port 3001
- ✅ Database (MySQL) on port 3306
- ✅ Cache (Redis) on port 6379

**All running in Docker with ONE command! 🐳**

---

## 💬 QUICK HELP

**"How do I...?"**

| Task | Command |
|------|---------|
| Start system | `docker-compose up -d` |
| Stop system | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Check status | `docker-compose ps` |
| Access database | `docker-compose exec mysql mysql -u hotel_user -p` |
| Reset everything | `docker-compose down -v` |
| Rebuild | `docker-compose build --no-cache` |
| Run migrations | `docker-compose exec backend npm run migration:run` |

---

## 🚀 YOU'RE READY!

**Run this command now:**

```bash
docker-compose up -d
```

Then open:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001/health

**Done! 🎉**

For questions, check the docs:
- Quick answers: [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)
- Detailed guide: [DOCKER_COMPLETE_SETUP.md](DOCKER_COMPLETE_SETUP.md)

---

**Happy deploying!** 🐳✨
