@echo off
echo 🏨 Starting Hotel Management System...

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start all services
echo 🚀 Building and starting all services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Show status
echo 📊 Service Status:
docker-compose ps

echo.
echo 🎉 Hotel Management System is ready!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001/api
echo 🗄️  Database: localhost:3306
echo.
echo 🔐 Demo Login:
echo    Email: admin@hotel.com
echo    Password: admin123
echo.
echo 📋 To view logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop:
echo    docker-compose down

pause