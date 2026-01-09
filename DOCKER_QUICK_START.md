# 🐳 DOCKER DEPLOYMENT - QUICK SUMMARY

## 🚀 ONE COMMAND TO START EVERYTHING

```bash
docker-compose up -d
```

That's it! Everything runs.

---

## 📍 What You Get

| Component | URL | Details |
|-----------|-----|---------|
| **Frontend** | http://localhost:3000 | React app (port 3000) |
| **Backend API** | http://localhost:3001 | Node.js API (port 3001) |
| **Database** | localhost:3306 | MySQL (port 3306) |
| **Cache** | localhost:6379 | Redis (port 6379) |

**Credentials:**
```
Database User:     hotel_user
Database Password: hotel_password
Database Name:     hotel_management
Root Password:     root_password
```

---

## ⚡ QUICK COMMANDS

### Start
```bash
docker-compose up -d                      # Start all services
docker-compose logs -f                    # View real-time logs
```

### Stop
```bash
docker-compose down                       # Stop & keep data
docker-compose down -v                    # Stop & delete all data
```

### Manage
```bash
docker-compose ps                         # View status
docker stats                              # View resource usage
docker-compose restart backend            # Restart backend
docker-compose build --no-cache           # Rebuild everything
```

### Database
```bash
# Run migrations
docker-compose exec backend npm run migration:run

# Access database
docker-compose exec mysql mysql -u hotel_user -photel_password hotel_management

# Backup
docker-compose exec mysql mysqldump -u hotel_user -photel_password hotel_management > backup.sql

# Restore
docker-compose exec -T mysql mysql -u hotel_user -photel_password hotel_management < backup.sql
```

### Logs
```bash
docker-compose logs -f                    # All logs
docker-compose logs -f backend            # Backend only
docker-compose logs -f frontend           # Frontend only
docker-compose logs -f mysql              # Database only
docker-compose logs --tail=100 backend    # Last 100 lines
```

---

## 🔧 Project Structure

```
hotel-management/
├── src/                           # Frontend (React)
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── hotel-backend/                 # Backend (Node.js)
│   ├── src/
│   │   ├── server.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   └── ...
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml             # Main Docker config
├── Dockerfile.frontend            # Frontend Docker
├── .env.local                     # Environment (dev)
├── .env.production                # Environment (prod)
│
└── DOCKER_COMPLETE_SETUP.md       # Full documentation
```

---

## 🛠️ First Time Setup

```bash
# 1. Clone/open project
cd /path/to/hotel-management

# 2. Check Docker is running
docker ps                          # Should work without error

# 3. Start everything
docker-compose up -d

# 4. Wait for health checks
docker-compose ps                  # All should be "Up (healthy)"

# 5. Open browser
# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001/health

# 6. Run migrations (if needed)
docker-compose exec backend npm run migration:run

# Done! ✅
```

---

## 🔐 Environment Variables

**Development (.env.local):**
```env
NODE_ENV=development
MYSQL_PASSWORD=hotel_password
JWT_SECRET=dev-secret-key-here
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
VITE_API_URL=http://localhost:3001
```

**Production (.env.production):**
```env
NODE_ENV=production
MYSQL_PASSWORD=CHANGE_THIS_IN_PROD
JWT_SECRET=CHANGE_THIS_LONG_RANDOM_STRING
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection error
```bash
# Check MySQL health
docker-compose exec mysql mysqladmin -u root -proot_password ping

# Restart
docker-compose restart mysql
```

### Out of memory
```bash
# Check resource usage
docker stats

# Limit resources in docker-compose.yml
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────┐
│              BROWSER (localhost:3000)               │
├─────────────────────────────────────────────────────┤
│                                                     │
│    ┌──────────────┐      ┌─────────────────┐       │
│    │   Frontend   │◄────►│   Backend API   │       │
│    │  (React)     │      │  (Node.js)      │       │
│    └──────────────┘      └────────┬────────┘       │
│                                   │                │
│                           ┌───────▼────────┐       │
│                           │     MySQL      │       │
│                           │   Database     │       │
│                           └────────────────┘       │
│                                   ▲                │
│                           ┌───────▼────────┐       │
│                           │     Redis      │       │
│                           │   Cache        │       │
│                           └────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Daily Tasks

### Development
```bash
# Start system
docker-compose up -d

# View logs while developing
docker-compose logs -f

# Make changes in code
# Changes auto-reload in containers

# Stop when done
docker-compose down
```

### Database Operations
```bash
# Create migration
docker-compose exec backend npm run migration:generate

# Run migration
docker-compose exec backend npm run migration:run

# Revert migration
docker-compose exec backend npm run migration:revert

# Seed data
docker-compose exec backend npm run seed
```

### Testing
```bash
# Backend tests
docker-compose exec backend npm test

# Run specific test
docker-compose exec backend npm test -- reservations.test.ts

# Watch mode
docker-compose exec backend npm test:watch
```

### Deployment
```bash
# Update .env.production with real secrets
nano .env.production

# Build fresh images
docker-compose build --no-cache

# Run on server
docker-compose -f docker-compose.yml up -d

# Backup before deploy
docker-compose exec mysql mysqldump -u hotel_user -photel_password hotel_management > backup.sql
```

---

## 📈 Monitoring

### Real-time Status
```bash
watch -n 2 'docker-compose ps'
```

### Resource Usage
```bash
docker stats --no-stream
```

### Log Aggregation
```bash
# Recent logs
docker-compose logs --tail=50

# Follow logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Health Checks
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:3001/health

# Database
docker-compose exec mysql mysqladmin -u hotel_user -photel_password ping
```

---

## 🔄 Updating Services

### Update Backend Code
```bash
# 1. Make code changes
# 2. Rebuild
docker-compose build backend

# 3. Restart
docker-compose up -d backend

# 4. Check logs
docker-compose logs -f backend
```

### Update Dependencies
```bash
# Install new package
docker-compose exec backend npm install <package-name>

# For frontend
docker-compose exec frontend npm install <package-name>

# Rebuild
docker-compose up -d --build
```

### Database Schema Changes
```bash
# 1. Modify entity/model
# 2. Generate migration
docker-compose exec backend npm run migration:generate

# 3. Review migration file
# 4. Run migration
docker-compose exec backend npm run migration:run
```

---

## 🚀 Deployment Checklist

Before going to production:

```
☐ Update .env.production with real secrets
☐ Change MYSQL_ROOT_PASSWORD
☐ Change MYSQL_PASSWORD
☐ Change JWT_SECRET and JWT_REFRESH_SECRET
☐ Set CORS_ORIGIN to your domain
☐ Update VITE_API_URL to your API domain
☐ Setup SSL/HTTPS certificate
☐ Configure database backups
☐ Setup monitoring (DataDog, New Relic)
☐ Test all features on staging
☐ Load test the system
☐ Test database failover
☐ Have rollback plan
```

---

## 📚 Full Documentation

Read more: **[DOCKER_COMPLETE_SETUP.md](DOCKER_COMPLETE_SETUP.md)**

Topics covered:
- Complete environment setup
- Production deployment
- Kubernetes setup
- Monitoring & logging
- Security best practices
- Troubleshooting guide
- Performance optimization

---

## 🎉 Success Indicators

After `docker-compose up -d`, you should see:

```
✅ All containers show "Up (healthy)"
✅ Frontend accessible at http://localhost:3000
✅ Backend API responding at http://localhost:3001/health
✅ MySQL accessible at localhost:3306
✅ Logs show no errors
✅ Can login to application
✅ Database queries working
```

---

## 💡 Pro Tips

1. **Always backup before migrations:**
   ```bash
   docker-compose exec mysql mysqldump ... > backup.sql
   ```

2. **Use volume mounts for development:**
   ```yaml
   volumes:
     - ./src:/app/src  # Auto-reload changes
   ```

3. **Keep .env.production secret:**
   ```bash
   echo ".env.production" >> .gitignore
   ```

4. **Monitor resource usage:**
   ```bash
   docker stats --no-stream
   ```

5. **Regular database cleanup:**
   ```bash
   docker-compose exec mysql mysql -e "OPTIMIZE TABLE users, reservations, invoices;"
   ```

---

## ❓ Need Help?

**Issues with Docker?**
- Check logs: `docker-compose logs -f`
- Rebuild: `docker-compose build --no-cache`
- Reset: `docker-compose down -v && docker-compose up -d`

**Database issues?**
- Check MySQL: `docker-compose exec mysql mysqladmin -u hotel_user -p ping`
- View errors: `docker-compose logs mysql`

**Frontend/Backend issues?**
- Check service logs: `docker-compose logs -f <service>`
- Restart service: `docker-compose restart <service>`

**Performance issues?**
- Check resources: `docker stats`
- Increase limits in docker-compose.yml
- Check database queries: `EXPLAIN SELECT ...`

---

## 🏁 Summary

| Task | Command |
|------|---------|
| **Start** | `docker-compose up -d` |
| **Stop** | `docker-compose down` |
| **Logs** | `docker-compose logs -f` |
| **Status** | `docker-compose ps` |
| **Rebuild** | `docker-compose build` |
| **Reset** | `docker-compose down -v` |
| **Database** | `docker-compose exec mysql mysql ...` |
| **Backend shell** | `docker-compose exec backend sh` |

---

🚀 **Ready to deploy?** Run: `docker-compose up -d`

✨ **That's all you need!**
