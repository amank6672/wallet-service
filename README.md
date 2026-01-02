# Wallet Service

A full-stack wallet management application built with Node.js, Express, MongoDB, and React. This application provides a complete solution for managing digital wallets with transaction history, balance tracking, and CSV export capabilities.

## 🚀 Features

- **Wallet Management**: Create wallets, view balances, and process transactions
- **Transaction History**: View, sort, and paginate through millions of transactions
- **High Performance**: Backend optimized for 10M+ requests per second
- **Real-time Updates**: Instant balance updates after transactions
- **CSV Export**: Export transaction history for analysis
- **Idempotency**: Prevent duplicate transactions with idempotency keys
- **Error Handling**: Comprehensive error handling with standardized error codes
- **Responsive UI**: Modern, responsive frontend with dark theme

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Setup](#manual-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (v20.10 or higher) and **Docker Compose** (v2.0 or higher)
  - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Node.js** (v18 or higher) - Only needed for manual setup
- **npm** or **yarn** - Only needed for manual setup
- **Git**

## 🐳 Quick Start with Docker

The easiest way to get started is using Docker Compose, which will set up all services automatically.

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd wallet-service
```

### Step 2: Start All Services

```bash
docker-compose up --build
```

This command will:
- Build the MongoDB, backend, and frontend Docker images
- Start all services in the correct order
- Set up networking between services

### Step 3: Access the Application

Once all containers are running:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Health Check**: http://localhost:3000/health

### Step 4: Verify Installation

1. Open http://localhost:3001 in your browser
2. Create a new wallet
3. Make a transaction
4. View transaction history

### Docker Commands

```bash
# Start services in detached mode (background)
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up --build --force-recreate
```

## 🛠️ Manual Setup

If you prefer to run services manually without Docker:

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   cat > .env << EOF
   PORT=3000
   NODE_ENV=development
   MONGO_URL=mongodb://localhost:27017/wallet
   CORS_ORIGIN=*
   LOG_LEVEL=INFO
   EOF
   ```

4. **Start MongoDB** (if not using Docker)
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7
   
   # Or install MongoDB locally
   # macOS: brew install mongodb-community
   # Ubuntu: sudo apt-get install mongodb
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory** (in a new terminal)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update API URL** (if backend is on different port)
   ```bash
   # Edit src/api/walletApi.js
   # Change BASE_URL if needed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173 (or port shown in terminal)
   - Backend: http://localhost:3000

## 📁 Project Structure

```
wallet-service/
├── backend/                 # Node.js/Express backend
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── tests/              # Test files
│   ├── dockerfile          # Backend Docker image
│   └── README.md           # Backend documentation
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── ...
│   ├── dockerfile          # Frontend Docker image
│   └── README.md           # Frontend documentation
│
├── docker-compose.yml      # Docker Compose configuration
└── README.md              # This file
```

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api/wallet
```

### Key Endpoints

#### Health Check
```http
GET /health
```

#### Create Wallet
```http
POST /api/wallet/setup
Content-Type: application/json

{
  "name": "John Doe",
  "balance": 1000.50
}
```

#### Get Wallet
```http
GET /api/wallet/wallet/:id
```

#### Process Transaction
```http
POST /api/wallet/transact/:walletId
Content-Type: application/json
X-Idempotency-Key: optional-unique-key

{
  "amount": 100.50,
  "description": "Payment for services"
}
```

#### Get Transactions
```http
GET /api/wallet/transactions?walletId=xxx&limit=50&cursor=xxx&sortBy=createdAt&sortOrder=desc
```

#### Export CSV
```http
GET /api/wallet/transactions/export/csv?walletId=xxx
```

For detailed API documentation, see [backend/README.md](./backend/README.md).

## 💻 Development

### Running in Development Mode

**With Docker:**
```bash
# Start services
docker-compose up

# View logs
docker-compose logs -f
```

**Without Docker:**
```bash
# Terminal 1: Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

### Making Changes

1. **Backend Changes**: 
   - Edit files in `backend/`
   - If using Docker, restart: `docker-compose restart backend`
   - If running manually, nodemon will auto-reload

2. **Frontend Changes**:
   - Edit files in `frontend/src/`
   - Vite will hot-reload automatically
   - If using Docker, restart: `docker-compose restart frontend`

### Environment Variables

**Backend** (`.env` in `backend/` directory):
```env
PORT=3000
NODE_ENV=development
MONGO_URL=mongodb://mongo:27017/wallet
CORS_ORIGIN=*
LOG_LEVEL=INFO
```

**Frontend** (`.env` in `frontend/` directory - optional):
```env
VITE_API_BASE_URL=http://localhost:3000/api/wallet
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm run lint
```

## 🚢 Deployment

### Production Build with Docker

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configuration

For production, update environment variables:

**Backend:**
- Set `NODE_ENV=production`
- Configure production MongoDB URL
- Set appropriate CORS origins
- Enable clustering: `ENABLE_CLUSTER=true`

**Frontend:**
- Update API base URL to production endpoint
- Build optimized bundle: `npm run build`

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in docker-compose.yml
```

#### MongoDB Connection Error

**Error**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
```bash
# Check if MongoDB is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongo

# Check MongoDB logs
docker-compose logs mongo
```

#### Frontend Can't Connect to Backend

**Error**: `Failed to fetch` or CORS errors

**Solution**:
1. Verify backend is running: `curl http://localhost:3000/health`
2. Check `BASE_URL` in `frontend/src/api/walletApi.js`
3. Verify CORS configuration in backend
4. Check browser console for detailed errors

#### Docker Build Fails

**Error**: Build errors or missing dependencies

**Solution**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
```

#### Transaction Errors

**Error**: `Transaction numbers are only allowed on a replica set`

**Solution**: This is expected for standalone MongoDB. The application automatically handles this by using atomic operations instead of transactions. For production, set up a MongoDB replica set.

### Debugging

**View Container Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Access Container Shell:**
```bash
# Backend container
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongo mongosh
```

**Check Service Status:**
```bash
docker-compose ps
```

**Inspect Network:**
```bash
docker network ls
docker network inspect wallet-service_default
```

## 📚 Additional Documentation

- [Backend Documentation](./backend/README.md) - Detailed backend API and architecture
- [Frontend Documentation](./frontend/README.md) - Frontend components and features

## 🔐 Security Notes

- Change default MongoDB credentials in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Configure proper CORS origins
- Use Redis for distributed rate limiting in production
- Set up MongoDB authentication

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

## 🤝 Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review service-specific README files
- Check Docker logs for errors
- Open an issue in the repository

---

**Happy Coding! 🚀**

