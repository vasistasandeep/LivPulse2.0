# LivPulse v2.0 - OTT Platform Management System

A comprehensive OTT platform management system built with modern web technologies, featuring modular micro-architecture and role-based access control.

## 🚀 Features

- **Unified Dashboards**: Real-time KPI monitoring and visualization
- **Data Input**: Form submission and CSV upload with validation
- **Role-Based Access**: 6 distinct roles (Admin, Executive, PM, TPM, EM, SRE)
- **Real-time Updates**: WebSocket integration with Redis pub/sub
- **Reporting**: PDF/Excel export and scheduled reports
- **Modern UI**: Clean, responsive design with Material-UI

## 🏗️ Architecture

### Backend
- **Node.js 18** + **Express.js** + **TypeScript**
- **PostgreSQL** with **Prisma ORM**
- **Redis** for caching and real-time features
- **JWT Authentication** with refresh tokens
- **Role-Based Access Control (RBAC)**

### Frontend
- **React 18** + **TypeScript** + **Material-UI**
- **React Router v6** for navigation
- **Zustand** for state management
- **React Query** for server state
- **Recharts** for data visualization

### Data Models
- **KPI Metrics**: Business performance indicators
- **Content Performance**: OTT content analytics
- **Risk Management**: Risk registry and tracking
- **Bug/Sprint Tracking**: Agile development metrics
- **Infrastructure Metrics**: CDN, uptime, system health

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full control including user management |
| **Executive** | Dashboards read-only access |
| **PM** | Explore KPIs + add KPI data |
| **TPM** | Admin access minus user management |
| **EM** | Access/update technical data |
| **SRE** | Access/alter infrastructure & CDN data |

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npx prisma generate
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run dev
```

## 🚀 Deployment

### Railway + Render + Vercel
1. **Database**: PostgreSQL + Redis on Railway
2. **Backend**: Express API on Render
3. **Frontend**: React app on Vercel

See deployment guides:
- [Railway Setup](./backend/RAILWAY_DEPLOY.md)
- [Render Backend](./backend/RENDER_DEPLOY.md)
- [Vercel Frontend](./frontend/VERCEL_DEPLOY.md)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - List users (Admin/TPM)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin/TPM)
- `DELETE /api/users/:id` - Delete user (Admin)

### Dashboards
- `GET /api/dashboards` - List dashboards
- `POST /api/dashboards` - Create dashboard
- `GET /api/dashboards/:id` - Get dashboard
- `PUT /api/dashboards/:id` - Update dashboard
- `DELETE /api/dashboards/:id` - Delete dashboard

### Data Input
- `POST /api/data/form` - Submit form data
- `POST /api/data/csv` - Upload CSV file
- `POST /api/data/csv/commit` - Commit CSV after preview
- `GET /api/data/:type` - Get data by type

### Reporting
- `GET /api/reports/export` - Export reports (PDF/Excel)
- `POST /api/reports/schedule` - Schedule reports
- `GET /api/reports` - List scheduled reports

## 🛠️ Development

### Project Structure
```
LivPulse2.0/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── dashboards/
│   │   │   ├── data-input/
│   │   │   ├── reporting/
│   │   │   └── common/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── modules/
    │   ├── pages/
    │   ├── routes/
    │   ├── store/
    │   └── theme/
    └── package.json
```

### Available Scripts

#### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/livpulse_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=http://localhost:3000
SMTP_URL=smtp://username:password@smtp.gmail.com:587
```

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_WEBSOCKET_URL=http://localhost:5000
VITE_APP_NAME=LivPulse v2.0
VITE_ENABLE_REAL_TIME=true
```

## 📈 Real-time Features

- **WebSocket Integration**: Live dashboard updates
- **Redis Pub/Sub**: Scalable real-time messaging
- **Hybrid Strategy**: 
  - Real-time: Infrastructure metrics, KPIs
  - Polling: Risk data, bug/sprint tracking

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

## 📝 License

This project is proprietary software for Sony Pictures Networks India Pvt Ltd.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support and questions, contact the development team.

---

**LivPulse v2.0** - Empowering OTT platform management with modern technology.