# LivPulse v2.0 Docker Deployment Guide

This guide covers deploying LivPulse v2.0 using Docker and Docker Compose for both development and production environments.

## 📋 Prerequisites

- Docker 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB RAM available
- At least 10GB disk space

## 🏗️ Architecture

The Docker setup includes:
- **PostgreSQL 15**: Primary database
- **Redis 7**: Caching and real-time features
- **Backend**: Node.js Express API
- **Frontend**: React app served by Nginx
- **Nginx**: Optional reverse proxy for production

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd LivPulse2.0
```

### 2. Environment Configuration
```bash
# Copy Docker environment template
cp .env.docker.example .env

# Edit the .env file with your values
nano .env
```

### 3. Development Deployment
```bash
# Windows
./scripts/docker-dev-setup.bat

# Linux/macOS
chmod +x ./scripts/docker-dev-setup.sh
./scripts/docker-dev-setup.sh

# Or manually
docker-compose up -d
```

### 4. Access Services
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | Required |
| `REDIS_PASSWORD` | Redis password | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |

### Database URLs
```bash
# Internal Docker network
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/livpulse
REDIS_URL=redis://:your_password@redis:6379

# External database (production)
DATABASE_URL=postgresql://user:pass@external-host:5432/database
REDIS_URL=redis://user:pass@external-host:6379
```

## 🏭 Production Deployment

### 1. Production Configuration
```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. SSL/TLS Setup
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Add your SSL certificates
cp your-domain.crt nginx/ssl/
cp your-domain.key nginx/ssl/
```

### 3. Resource Limits
Production deployment includes:
- Memory limits for each service
- Auto-restart policies
- Health checks
- Multiple replicas for backend/frontend

## 🛠️ Management Commands

### Service Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend
```

### Database Management
```bash
# Run database migrations
docker-compose exec backend npm run prisma:migrate

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d livpulse

# Backup database
docker-compose exec postgres pg_dump -U postgres livpulse > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres livpulse < backup.sql
```

### Development Utilities
```bash
# Rebuild specific service
docker-compose build backend

# Force recreate containers
docker-compose up -d --force-recreate

# Remove all data (careful!)
docker-compose down -v
```

## 📊 Monitoring

### Health Checks
All services include health checks:
- **PostgreSQL**: `pg_isready`
- **Redis**: Connection test
- **Backend**: HTTP health endpoint
- **Frontend**: Nginx status

### Log Aggregation
```bash
# View all logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend

# Follow last 100 lines
docker-compose logs --tail=100 -f
```

## 🔒 Security

### Production Security
- Non-root users for all services
- Resource limits
- Network isolation
- Security headers in Nginx
- Secure environment variables

### Network Security
```bash
# Services communicate on isolated network
# Only necessary ports exposed to host
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check if ports are in use
netstat -an | grep :3000
netstat -an | grep :5000

# Change ports in docker-compose.yml if needed
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database is ready
docker-compose exec postgres pg_isready -U postgres
```

#### 3. Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### 4. Build Issues
```bash
# Clean build
docker-compose build --no-cache

# Remove old images
docker system prune -a
```

### Performance Tuning

#### Memory Optimization
```bash
# Adjust in docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

#### Volume Performance
```bash
# Use named volumes for better performance
volumes:
  postgres_data:
  redis_data:
```

## 📋 Maintenance

### Regular Tasks
```bash
# Update images
docker-compose pull

# Clean unused data
docker system prune

# Backup data volumes
docker run --rm -v livpulse_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Updates
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

## 🆘 Support

For issues with Docker deployment:
1. Check service logs: `docker-compose logs [service]`
2. Verify environment variables in `.env`
3. Ensure Docker has sufficient resources
4. Check network connectivity between services