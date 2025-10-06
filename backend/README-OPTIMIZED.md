# 🚀 LivPulse v2.0 Backend - Clean & Optimized

A production-ready OTT Platform Management System backend built with TypeScript, Express, and PostgreSQL.

## ✨ Features

- **🔐 JWT Authentication** - Secure user authentication with refresh tokens
- **🗄️ PostgreSQL Database** - Robust data persistence with Prisma ORM
- **🛡️ Security First** - Helmet, CORS, rate limiting, and input validation
- **📊 Health Monitoring** - Built-in health checks and logging
- **🚀 Production Ready** - Optimized for Railway deployment
- **📝 TypeScript** - Full type safety and modern JavaScript features
- **🔄 Auto-scaling** - Designed for cloud deployment platforms

## 🏗️ Architecture

```
src/
├── modules/          # Feature-based modules
│   ├── auth/         # Authentication & authorization
│   ├── data-input/   # Data processing & CSV uploads
│   ├── common/       # Shared utilities & middleware
│   └── ...
├── lib/              # Core libraries
│   └── database.ts   # Prisma client configuration
└── server.ts         # Application entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Development Setup

1. **Clone and navigate**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.optimized .env
   # Edit .env with your database credentials
   ```

4. **Set up database**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment

Use the optimized deployment script:

**Linux/Mac:**
```bash
chmod +x deploy-optimized.sh
./deploy-optimized.sh
```

**Windows:**
```powershell
./deploy-optimized.ps1
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `8000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `FRONTEND_URL` | Frontend application URL | Yes | - |

### Railway Deployment

1. **Connect GitHub repository** to Railway
2. **Add PostgreSQL service** to your project
3. **Set environment variables**:
   ```
   JWT_SECRET=your-256-bit-secret
   JWT_REFRESH_SECRET=your-256-bit-refresh-secret
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
4. **Deploy** - Railway will auto-deploy on git push

## 📡 API Endpoints

### Health & Status
- `GET /api/health` - Service health check
- `GET /api/ping` - Simple connectivity test
- `GET /api/debug/database` - Database connection status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Data Management
- `POST /api/data/upload` - CSV data upload
- `GET /api/data/export` - Data export

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - Joi schema validation
- **JWT Tokens** - Secure authentication
- **Password Hashing** - bcrypt encryption

## 📊 Monitoring

### Health Checks
- Application health: `/api/health`
- Database connectivity: `/api/debug/database`
- Uptime monitoring ready

### Logging
- **Development**: Detailed query logs
- **Production**: Error and warning logs
- **Winston** logger with structured output

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:studio` | Open Prisma Studio |

## 🔄 Deployment Pipeline

1. **Code Push** → GitHub repository
2. **Auto-build** → Railway detects changes
3. **TypeScript Compilation** → `npm run build`
4. **Health Check** → `/api/health` endpoint
5. **Live** → Application deployed

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check DATABASE_URL format
postgresql://username:password@hostname:port/database

# Verify database is running
npm run prisma:studio
```

**JWT Errors**
```bash
# Ensure JWT secrets are set
echo $JWT_SECRET
echo $JWT_REFRESH_SECRET
```

**Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📈 Performance

- **Response Time**: < 100ms for health checks
- **Throughput**: 100 requests/15min per IP (configurable)
- **Memory Usage**: ~200MB base + database connections
- **CPU Usage**: Optimized for single-core Railway instances

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

---

**Built with ❤️ for LivPulse v2.0**