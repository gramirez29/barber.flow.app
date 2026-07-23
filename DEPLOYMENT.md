# 🚀 Deployment Guide - Barber Flow

## Table of Contents
- [Local Development with Docker](#local-development-with-docker)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Local Development with Docker

### Prerequisites
- Docker & Docker Compose installed
- Git repository cloned

### Quick Start

```bash
# Navigate to project root
cd barber.flow.app

# Start all services (MongoDB, Backend API, Frontend)
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:7016
- **MongoDB**: mongodb://admin:barberflow_2026@localhost:27017

### Development Workflow

```bash
# Start services
docker-compose up -d

# Live development (inside containers)
# Frontend auto-reloads on code changes (HMR)
# Backend hot-reload with dotnet watch

# View specific service logs
docker-compose logs -f api      # Backend
docker-compose logs -f web      # Frontend
docker-compose logs -f mongodb  # Database

# Stop services
docker-compose down

# Remove volumes (reset database)
docker-compose down -v
```

---

## Production Deployment

### Option 1: Docker Compose (Self-Hosted)

#### On a Linux Server

```bash
# Clone repository
git clone https://github.com/gramirez29/barber.flow.app.git
cd barber.flow.app

# Create production environment file
cat > .env.production << EOF
ASPNETCORE_ENVIRONMENT=Production
MONGODB_URI=mongodb://admin:your_strong_password@mongodb:27017/barber-flow-db
JWT_SECRET=your_jwt_secret_here
CORS_ALLOWED_ORIGINS=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com
NODE_ENV=production
EOF

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose ps
docker-compose logs
```

#### Security Checklist
- [ ] Change MongoDB passwords in docker-compose.prod.yml
- [ ] Update JWT_SECRET to a strong random value
- [ ] Configure CORS_ALLOWED_ORIGINS with your domain
- [ ] Set up HTTPS with nginx reverse proxy or Let's Encrypt
- [ ] Configure firewall rules (only expose ports 80, 443)
- [ ] Enable MongoDB authentication
- [ ] Set up automated backups for mongodb_data volume

#### Reverse Proxy (Nginx) Configuration

```nginx
upstream api_backend {
    server api:8080;
}

upstream web_frontend {
    server web:3000;
}

# API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://web_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Cloud Platforms

#### Railway.app (Recommended - Easy)

**Backend Deployment:**
```bash
# Login to Railway
railway login

# Link project
railway link

# Deploy backend
cd barber-flow-api/Barber.Flow.Api
railway up

# Set environment variables in Railway dashboard
# - ASPNETCORE_ENVIRONMENT=Production
# - MONGODB_URI=<from MongoDB Atlas>
# - JWT_SECRET=<your secret>
```

**Frontend Deployment:**
```bash
# Deploy frontend
cd barber-flow-web
railway up

# Set environment variables
# - VITE_API_BASE_URL=<your-railway-api-url>
```

#### Vercel (Alternative for Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd barber-flow-web
vercel

# Set environment variable
# VITE_API_BASE_URL=<your-backend-url>
```

#### MongoDB Atlas (Cloud Database)

1. Visit https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string
5. Update docker-compose MONGODB_URI or .env

---

## Environment Configuration

### Frontend (.env.local)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:7016
VITE_API_TIMEOUT=30000

# Optional Features
VITE_ANALYTICS_ID=your_analytics_id
```

### Backend (appsettings.Production.json)

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "MongoDb": {
    "ConnectionString": "mongodb://admin:password@mongodb:27017/barber-flow-db",
    "DatabaseName": "barber-flow-db"
  },
  "Jwt": {
    "Secret": "your_jwt_secret_here",
    "Issuer": "barber-flow-api",
    "Audience": "barber-flow-web",
    "ExpirationMinutes": 1440
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"]
  }
}
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs api
docker-compose logs web
docker-compose logs mongodb

# Common issues:
# 1. Port already in use
docker ps  # Show running containers
lsof -i :7016  # Check if port 7016 is in use

# 2. MongoDB connection failed
# Verify connection string and credentials

# 3. Build errors
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Database Issues

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p

# Check database status
docker-compose logs mongodb

# Reset database
docker-compose down -v  # WARNING: Deletes all data
docker-compose up
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase memory if needed
# Edit docker-compose.yml, add:
# deploy:
#   resources:
#     limits:
#       memory: 2G
```

### Frontend Not Loading

- Check browser console for errors
- Verify VITE_API_BASE_URL is correct
- Ensure backend is accessible: `curl http://localhost:7016/health`

### API Endpoint Not Responding

```bash
# Test API health
curl http://localhost:7016/health

# Check logs
docker-compose logs api

# Verify MongoDB connection
curl http://localhost:7016/api/health/db
```

---

## Monitoring & Maintenance

### Regular Backups

```bash
# Backup MongoDB data
docker-compose exec mongodb mongodump --out=/data/backup

# Backup volumes
docker run --rm -v mongodb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mongodb_data.tar.gz /data
```

### Update Services

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d
```

### Logs & Monitoring

```bash
# View real-time logs
docker-compose logs -f

# Export logs to file
docker-compose logs > deployment.log

# Monitor specific service
watch 'docker-compose logs --tail=20 api'
```

---

## Performance Tuning

### MongoDB Optimization

```yaml
# docker-compose.yml
mongodb:
  command: --wiredTigerCacheSizeGB=2 --maxConns=500
```

### API Configuration

```json
{
  "ConnectionPoolSize": 100,
  "CacheEnabled": true,
  "CacheDurationMinutes": 5
}
```

### Frontend Optimization

```json
{
  "build": {
    "target": "es2020",
    "minify": "esbuild",
    "sourcemap": false
  }
}
```

---

## Support & Documentation

- **Backend API Docs**: http://localhost:7016/swagger
- **GitHub Issues**: https://github.com/gramirez29/barber.flow.app/issues
- **Documentation**: See [backend-docs](./barber-flow-api/application-backend-docs/)

---

## License

MIT License - See LICENSE file for details
