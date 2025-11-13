# GroundPoint - Drone Construction Progress SaaS Platform

A project-management and monitoring platform for drone operators documenting construction progress, with integrated invoicing and payment processing.

## Overview

GroundPoint enables drone operators to:
- Manage multiple projects and construction sites
- Upload and organize time-series construction photos
- Compare progress over time with timeline and comparison tools
- Generate invoices and collect payments from clients
- Receive automatic payouts via Stripe Connect

## Architecture

- **Backend**: Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Workers**: BullMQ, Redis
- **Storage**: S3-compatible (MinIO for local, AWS S3 for production)
- **Payments**: Stripe Connect, Stripe Tax
- **Infrastructure**: Docker, Terraform (for production)

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 14+
- Redis 7+

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd GroundPoint
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 5. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 6. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Workers
cd backend
npm run worker
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- MinIO Console: http://localhost:9001

## Development

### Database Migrations

```bash
cd backend
npx prisma migrate dev --name <migration-name>
```

### Running Tests

```bash
# Backend unit tests
cd backend
npm test

# Backend integration tests
npm run test:integration

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Format
npm run format
```

## Project Structure

```
GroundPoint/
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── workers/       # Background job workers
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Prisma schema and migrations
│   └── tests/             # Test files
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   ├── store/         # State management
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
├── workers/               # Standalone worker processes
├── infra/                 # Infrastructure as code
│   ├── terraform/         # Terraform configurations
│   └── docker/            # Docker configurations
└── docs/                  # Documentation
    ├── api/               # API documentation
    └── runbooks/          # Operational runbooks
```

## Key Features

### MVP Features
- User authentication with JWT
- Multi-tenant organization management
- Project and site management
- Image upload with metadata
- Timeline and calendar view
- Side-by-side image comparison
- Subscription billing (Free, Professional, Business, Enterprise)
- Invoice generation and management
- Payment processing via Stripe
- Automatic payouts to operators

### Premium Features
- Layered image overlay comparison
- Video upload and streaming
- Photogrammetry processing
- Extended data retention
- Custom branding

## Documentation

- [Technical Specifications](SPECIFICATIONS.md)
- [Project Plan](PLAN.md)
- [Build State Guide](STATE.md)
- [Implementation Progress](IMPLEMENTATION_PROGRESS.md)
- [Task Breakdown](TASKS/)

## Support

For issues and questions, please create an issue in the repository.

## License

Proprietary - All rights reserved
