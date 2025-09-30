# LivPulse v2.0 CI/CD Pipeline Guide

This guide covers setting up and using the GitHub Actions CI/CD pipelines for LivPulse v2.0.

## 🏗️ Pipeline Overview

The CI/CD system consists of four main workflows:

1. **CI/CD Pipeline** (`ci-cd.yml`) - Main build, test, and deployment workflow
2. **Comprehensive Testing** (`testing.yml`) - Extended testing across multiple environments
3. **Dependency Management** (`dependency-management.yml`) - Automated dependency updates and security
4. **Environment Deployment** (`deployment.yml`) - Environment-specific deployments

## 🔧 Setup Requirements

### 1. Repository Secrets

Configure the following secrets in your GitHub repository settings:

#### Railway Deployment
```
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_SERVICE_ID=your_service_id_here
```

#### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

#### Application URLs
```
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
VITE_API_URL=https://your-backend-domain.com/api
```

#### Staging Environment (Optional)
```
STAGING_DATABASE_URL=postgresql://...
STAGING_REDIS_URL=redis://...
STAGING_FRONTEND_URL=https://staging.your-domain.com
STAGING_BACKEND_URL=https://api-staging.your-domain.com
```

#### Database URLs
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### 2. Environment Setup

#### GitHub Environments
Create environments in your repository:
- `staging` - For staging deployments
- `production` - For production deployments

Configure environment protection rules:
- **Production**: Require manual approval
- **Staging**: Auto-deploy from develop branch

## 📋 Workflow Details

### Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
1. **Frontend Tests** - Linting, type checking, unit tests, build
2. **Backend Tests** - Linting, type checking, unit tests with DB
3. **Security Scan** - Trivy vulnerability scanning
4. **Docker Build** - Build and push container images
5. **Deploy Backend** - Deploy to Railway
6. **Deploy Frontend** - Deploy to Vercel
7. **E2E Tests** - End-to-end testing on deployed apps
8. **Notification** - Deployment status notification

### Comprehensive Testing (`testing.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main`
- Nightly schedule (2 AM UTC)

**Features:**
- **Matrix Testing** - Multiple OS and Node.js versions
- **Performance Testing** - API load testing with Artillery
- **Code Quality** - ESLint, type checking, SonarCloud
- **Integration Tests** - Full stack testing with Docker
- **Accessibility Tests** - WCAG compliance testing

### Dependency Management (`dependency-management.yml`)

**Triggers:**
- Weekly schedule (Mondays 9 AM UTC)
- Manual trigger

**Features:**
- **Security Audit** - npm audit for vulnerabilities
- **Dependency Updates** - Automated PR creation
- **License Compliance** - License compatibility checking

### Environment Deployment (`deployment.yml`)

**Triggers:**
- Push to `main` (production)
- Push to `develop` (staging)
- Manual dispatch with environment selection
- Version tags (`v*`)

**Features:**
- **Environment Detection** - Auto-determine target environment
- **Pre-deployment Checks** - Tests before deployment
- **Database Migrations** - Prisma migrations
- **Health Checks** - Post-deployment verification
- **Rollback** - Automated rollback on failure

## 🚀 Usage Guide

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   ```

2. **Create Pull Request**
   - PR triggers testing pipeline
   - All tests must pass for merge

3. **Merge to Develop**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   ```
   - Auto-deploys to staging environment

4. **Release to Production**
   ```bash
   git checkout main
   git merge develop
   git tag v1.0.0
   git push origin main --tags
   ```
   - Auto-deploys to production environment

### Manual Deployments

#### Deploy Specific Environment
```bash
# Go to Actions tab in GitHub
# Select "Environment Deployment"
# Click "Run workflow"
# Choose environment: staging/production
```

#### Emergency Rollback
```bash
# If deployment fails, rollback job runs automatically
# Or manually trigger rollback from Actions tab
```

### Monitoring Deployments

#### View Pipeline Status
1. Go to **Actions** tab in GitHub repository
2. Select the workflow run
3. Monitor job progress and logs

#### Health Checks
```bash
# Production health check
curl https://livpulse-backend-production.up.railway.app/api/health

# Staging health check  
curl https://staging-api.your-domain.com/api/health
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Test Failures
```bash
# Check test logs in Actions tab
# Fix failing tests locally:
npm run test:ci
```

#### 2. Deployment Failures
```bash
# Check deployment logs
# Verify secrets are configured
# Check service health
```

#### 3. Build Failures
```bash
# Check TypeScript compilation
npm run type-check

# Check linting
npm run lint
```

#### 4. Database Migration Issues
```bash
# Check DATABASE_URL secret
# Verify Prisma schema
npx prisma migrate status
```

### Debug Commands

#### Local Testing
```bash
# Run tests locally
npm run test:ci

# Build locally
npm run build

# Type check
npm run type-check
```

#### Docker Testing
```bash
# Test Docker build locally
docker build -t livpulse-backend ./backend
docker run -p 5000:5000 livpulse-backend
```

## 📊 Monitoring and Metrics

### Pipeline Metrics
- **Build Success Rate** - Track in Actions tab
- **Test Coverage** - Generated in test reports
- **Deployment Time** - Monitor job duration
- **Failure Rate** - Track failed deployments

### Performance Monitoring
- **Load Testing** - Artillery reports in artifacts
- **Bundle Size** - Frontend build analysis
- **API Response Times** - Backend performance tests

### Security Monitoring
- **Vulnerability Scans** - Trivy security reports
- **Dependency Audits** - Weekly security checks
- **License Compliance** - License report artifacts

## 🔐 Security Best Practices

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly
- Use environment-specific secrets

### Access Control
- Protect production environment
- Require approvals for production deploys
- Use least privilege access

### Vulnerability Management
- Monitor security advisories
- Auto-update dependencies weekly
- Regular security scans

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Deployment Guide](https://docs.railway.app/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🆘 Support

For CI/CD pipeline issues:
1. Check workflow logs in Actions tab
2. Verify all secrets are configured
3. Test commands locally first
4. Review this documentation
5. Check service-specific documentation