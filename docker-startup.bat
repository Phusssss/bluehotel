@echo off
REM Hotel Management System - Docker Startup Script (Windows)
REM Usage: docker-startup.bat

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo 0x1F3E8 Hotel Management System
echo Docker Quick Start
echo ==========================================
echo.

REM Check Docker
echo 0x1F50D Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo 0x274C Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)
echo 0x2705 Docker found
echo.

REM Check Docker Compose
echo 0x1F50D Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo 0x274C Docker Compose not found. Please install Docker Compose.
    pause
    exit /b 1
)
echo 0x2705 Docker Compose found
echo.

REM Check if Docker daemon is running
echo 0x1F50D Checking Docker daemon...
docker ps >nul 2>&1
if errorlevel 1 (
    echo 0x274C Docker daemon not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo 0x2705 Docker daemon running
echo.

REM Load environment
echo 0x1F4CB Loading environment...
if not exist ".env.local" (
    echo 0x26A0 .env.local not found. Using defaults...
) else (
    echo 0x2705 Environment loaded from .env.local
)
echo.

REM Build images
echo 0x1F3D7 Building Docker images...
docker-compose build --parallel
if errorlevel 1 (
    echo 0x274C Build failed
    pause
    exit /b 1
)
echo 0x2705 Images built successfully
echo.

REM Start services
echo 0x1F680 Starting services...
docker-compose up -d
if errorlevel 1 (
    echo 0x274C Failed to start services
    pause
    exit /b 1
)
echo 0x2705 Services started
echo.

REM Wait for services to be healthy
echo 0x23F3 Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check health status
echo 0x1F3E5 Checking health status...
docker-compose ps
echo.

echo ==========================================
echo 0x2705 STARTUP COMPLETE!
echo ==========================================
echo.
echo 0x1F4CD Access your application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3001
echo    API Docs:  http://localhost:3001/api/docs
echo.
echo 0x1F4CA Database:
echo    Host:      localhost
echo    Port:      3306
echo    Database:  hotel_management
echo    User:      hotel_user
echo.
echo 0x1F4DD Useful commands:
echo    View logs:       docker-compose logs -f
echo    Stop:            docker-compose down
echo    Database shell:  docker-compose exec mysql mysql -u hotel_user -photel_password hotel_management
echo.
echo 0x1F4D6 Full documentation: DOCKER_COMPLETE_SETUP.md
echo.
pause
