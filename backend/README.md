# Wallet Service - Backend

A high-performance, production-ready wallet service backend built with Node.js, Express, and MongoDB. Designed to handle 10 million requests per second with support for millions of transactions per user.

## 🚀 Features

- **High Performance**: Optimized for 10M+ requests/second
- **Scalable Architecture**: Connection pooling, clustering support, and efficient database queries
- **Transaction Management**: Atomic operations with MongoDB transactions (replica set) or optimistic locking (standalone)
- **Idempotency**: Built-in idempotency support to prevent duplicate transactions
- **Error Handling**: Standardized error responses with error codes
- **Request Validation**: Input validation using express-validator
- **Rate Limiting**: In-memory rate limiting (Redis recommended for production)
- **Security**: Helmet.js for security headers, CORS configuration
- **Logging**: Structured logging with configurable log levels
- **Health Checks**: Database connection status monitoring
- **Pagination**: Skip/limit pagination for efficient handling of large datasets

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Performance Optimizations](#performance-optimizations)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)
- [Scaling for Production](#scaling-for-production)

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.19.2
- **Database**: MongoDB with Mongoose 8.0.0
- **Validation**: express-validator 7.0.1
- **Security**: Helmet.js 7.1.0
- **Compression**: compression 1.7.4
- **Decimal Handling**: big.js 6.2.1
- **Testing**: Jest 29.7.0

## 📁 Project Structure

```
backend/
├── app.js                        # Express app configuration & middleware setup
├── server.js                     # Server entry point with clustering support
├── db.js                         # Database connection & pooling configuration
│
├── controllers/                  # Request handlers (thin layer)
│   ├── healthController.js      # Health check endpoint handler
│   └── walletController.js       # Wallet & transaction endpoints
│
├── services/                     # Business logic layer
│   ├── walletService.js          # Wallet operations (setup, get)
│   ├── transactionService.js     # Transaction processing logic
│   ├── transactionQueryService.js # Query building & pagination
│   ├── idempotencyService.js     # Idempotency key management
│   ├── exportService.js          # CSV export functionality
│   └── healthService.js          # Health check validation logic
│
├── models/                       # Mongoose models
│   ├── Wallet.js                 # Wallet schema with indexes
│   ├── Transaction.js            # Transaction schema with indexes
│   └── Idempotency.js            # Idempotency schema with TTL
│
├── routes/                       # API route definitions
│   └── walletRoutes.js           # Wallet API routes with validation
│
├── middleware/                   # Custom middleware
│   ├── errorHandler.js           # Global error handling
│   ├── rateLimiter.js           # Rate limiting middleware
│   ├── responseFormatter.js      # Response standardization
│   └── validator.js              # Validation middleware
│
├── utils/                        # Utility functions & helpers
│   ├── mappers.js                # DTO transformations (model to API)
│   ├── validationRules.js        # Express-validator rules
│   ├── errors.js                 # Custom error classes & codes
│   ├── logger.js                 # Structured logging utility
│   ├── decimal.js                # Decimal precision handling
│   └── csv.js                    # CSV conversion utility
│
└── tests/                        # Test files
    ├── unit/                     # Unit tests
    └── integration/              # Integration tests
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v7 or higher)
- yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wallet-service/backend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker-compose up -d mongo
   
   # Or start MongoDB locally
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   yarn dev
   
   # Production mode
   yarn start
   
   # With clustering (utilizes all CPU cores)
   ENABLE_CLUSTER=true yarn start
   ```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
MONGO_URL=mongodb://localhost:27017/wallet

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=INFO

# Rate Limiting (for in-memory rate limiter)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Clustering
ENABLE_CLUSTER=false
WORKERS=4
```

### Database Connection Pool

The database connection is configured with optimized pool settings:

- **Max Pool Size**: 100 connections
- **Min Pool Size**: 10 connections
- **Connection Timeout**: 10 seconds
- **Socket Timeout**: 45 seconds
- **Compression**: zlib, snappy, zstd
- **Write Concern**: majority
- **Retry Writes/Reads**: Enabled

### MongoDB Replica Set (Optional)

For production with transaction support, set up MongoDB as a replica set:

```bash
# In MongoDB shell
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

The application automatically detects replica set support and uses transactions when available.

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/wallet
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connected": true,
    "healthy": true,
    "readyState": 1,
    "readyStateText": "connected",
    "host": "localhost",
    "port": 27017,
    "database": "wallet",
    "pingTime": "2ms",
    "queryTime": "5ms",
    "writeTest": true,
    "readTest": true,
    "supportsTransactions": true,
    "poolSize": {
      "current": 10,
      "available": 90,
      "active": 5
    },
    "validationTime": "15ms"
  }
}
```

#### 2. Setup Wallet
```http
POST /api/wallet/setup
Content-Type: application/json

{
  "name": "John Doe",
  "balance": 1000.50
}
```

**Request Body:**
- `name` (required): Wallet owner name
- `balance` (optional, default: 0): Initial balance (supports up to 4 decimal places)

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "balance": "1000.5000",
  "transactionId": "507f1f77bcf86cd799439012",
  "name": "John Doe",
  "date": "2024-01-01T00:00:00.000Z"
}
```

**Note:** `transactionId` is included only if initial balance > 0. Balance supports up to 4 decimal places precision.

#### 3. Get Wallet
```http
GET /api/wallet/wallet/:id
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "balance": "1000.5000",
  "name": "John Doe",
  "date": "2024-01-01T00:00:00.000Z"
}
```

#### 4. Process Transaction
```http
POST /api/wallet/transact/:walletId
Content-Type: application/json
X-Idempotency-Key: optional-unique-key

{
  "amount": 100.50,
  "description": "Payment for services",
  "idempotencyKey": "optional-unique-key"
}
```

**Request Body:**
- `amount` (required): Transaction amount (positive for credit, negative for debit)
- `description` (optional): Transaction description
- `idempotencyKey` (optional): Unique key to prevent duplicate transactions

**Response:**
```json
{
  "balance": "1100.5000",
  "transactionId": "507f1f77bcf86cd799439012"
}
```

**Note:** 
- Use positive amount for CREDIT, negative amount for DEBIT
- Amount supports up to 4 decimal places (e.g., 4.1203, 0.321, 1.0045)
- Balance is returned with 4 decimal precision

#### 5. Get Transactions
```http
GET /api/wallet/transactions?walletId=507f1f77bcf86cd799439011&skip=0&limit=25&sortBy=date&sortOrder=desc
```

**Query Parameters:**
- `walletId` (required): Wallet ID
- `skip` (optional, default: 0): Number of transactions to skip
- `limit` (optional, default: 25, max: 100): Number of transactions to return
- `sortBy` (optional, default: 'date'): Field to sort by ('date' or 'amount')
- `sortOrder` (optional, default: 'desc'): Sort order ('asc' or 'desc')

**Response:** Array of transactions (not wrapped in object)
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "walletId": "507f1f77bcf86cd799439011",
    "amount": "100.5000",
    "balance": "1100.5000",
    "description": "Payment for services",
    "date": "2024-01-01T00:00:00.000Z",
    "type": "CREDIT"
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "walletId": "507f1f77bcf86cd799439011",
    "amount": "-50.2500",
    "balance": "1050.2500",
    "description": "Purchase",
    "date": "2024-01-01T00:05:00.000Z",
    "type": "DEBIT"
  }
]
```

**Note:** 
- Uses skip/limit pagination instead of cursor-based
- Response is a direct array, not wrapped in an object
- `date` field is used instead of `createdAt`
- Each transaction includes `type` field ('CREDIT' or 'DEBIT')

#### 6. Export Transactions (CSV)
```http
GET /api/wallet/transactions/export/csv?walletId=507f1f77bcf86cd799439011&limit=10000
```

## 🗄️ Database Schema

### Wallet Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  balance: Decimal128 (required),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `_id` (default)
- `createdAt` (descending)

### Transaction Model
```javascript
{
  _id: ObjectId,
  walletId: ObjectId (ref: Wallet, indexed),
  amount: Decimal128 (required),
  balance: Decimal128 (required),
  description: String,
  type: String (enum: ['CREDIT', 'DEBIT'], indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `walletId` (ascending)
- `type` (ascending)
- `{ walletId: 1, createdAt: -1 }` (compound)
- `{ walletId: 1, type: 1, createdAt: -1 }` (compound)
- `{ walletId: 1, amount: 1, createdAt: -1 }` (for amount sorting)
- `createdAt` (descending)

### Idempotency Model
```javascript
{
  _id: ObjectId,
  key: String (unique, indexed),
  status: String (enum: ['processing', 'done', 'failed'], indexed),
  result: Mixed,
  createdAt: Date (TTL: 24 hours)
}
```

**Indexes:**
- `key` (unique)
- `{ key: 1, status: 1 }` (compound)

## 🏗️ Architecture

### Request Flow

1. **Request** → Express App (`app.js`)
2. **Middleware Chain**:
   - Helmet (security headers)
   - Compression
   - CORS
   - Request Logging
   - Rate Limiting (except `/health`)
   - Response Formatter
3. **Route** → Route Handler (`routes/`)
4. **Validation** → Validation Middleware (`middleware/validator.js`)
   - Uses validation rules from `utils/validationRules.js`
5. **Controller** → Request Handler (`controllers/`)
   - Extracts request data
   - Calls appropriate service
   - Uses mappers (`utils/mappers.js`) for response transformation
6. **Service Layer** → Business Logic (`services/`)
   - **walletService**: Wallet operations
   - **transactionService**: Transaction processing
   - **idempotencyService**: Idempotency handling
   - **transactionQueryService**: Query building
7. **Database** → Models (`models/`)
   - Uses MongoDB transactions when available
   - Atomic operations for standalone MongoDB
8. **Response** → Error Handler (if error) or Response Formatter

### Key Components

#### Architecture Layers

**1. Controllers Layer** (`controllers/`)
- Thin request handlers that delegate to services
- Handle HTTP request/response only
- Use mappers for response transformation
- Examples: `healthController.js`, `walletController.js`

**2. Services Layer** (`services/`)
- **walletService**: Wallet CRUD operations
- **transactionService**: Core transaction processing with atomic operations
- **transactionQueryService**: Query building and pagination logic
- **idempotencyService**: Idempotency key management
- **exportService**: CSV export functionality
- **healthService**: Database health validation

**3. Middleware Layer** (`middleware/`)
- **errorHandler**: Global error handling with standardized error responses
- **rateLimiter**: In-memory rate limiting (100 req/min per IP)
- **responseFormatter**: Wraps successful responses in standard format
- **validator**: Request validation using express-validator

**4. Utilities Layer** (`utils/`)
- **mappers**: Data Transfer Object (DTO) transformations
- **validationRules**: Express-validator rule definitions
- **errors**: Custom error classes and error codes
- **logger**: Structured logging utility
- **decimal**: Decimal precision handling
- **csv**: CSV conversion utility

#### Models

- Optimized queries with `.lean()` for better performance
- Proper indexing for common query patterns
- TTL indexes for automatic cleanup
- JSON transformation for API responses

### Code Organization Principles

The codebase follows a **layered architecture** with clear separation of concerns:

1. **Controllers** (`controllers/`)
   - **Responsibility**: Handle HTTP requests and responses
   - **What they do**: Extract request data, call services, format responses
   - **What they DON'T do**: Business logic, database queries, complex calculations
   - **Example**: `walletController.js` - extracts `req.body`, calls `walletService`, uses `mappers` for response

2. **Services** (`services/`)
   - **Responsibility**: Business logic and orchestration
   - **What they do**: Process transactions, validate business rules, coordinate multiple operations
   - **What they DON'T do**: HTTP concerns, response formatting
   - **Examples**:
     - `transactionService.js` - Core transaction processing
     - `idempotencyService.js` - Idempotency management
     - `transactionQueryService.js` - Query building logic
     - `exportService.js` - CSV export logic

3. **Utilities** (`utils/`)
   - **Responsibility**: Reusable helper functions
   - **What they do**: Data transformations, validation rules, error definitions
   - **Examples**:
     - `mappers.js` - Model to DTO transformations
     - `validationRules.js` - Express-validator rules
     - `errors.js` - Custom error classes

4. **Middleware** (`middleware/`)
   - **Responsibility**: Request processing pipeline
   - **What they do**: Validation, error handling, response formatting, rate limiting

5. **Models** (`models/`)
   - **Responsibility**: Database schema and data access
   - **What they do**: Define schemas, indexes, transformations

### Benefits of This Architecture

- **Maintainability**: Easy to locate and modify code
- **Testability**: Each layer can be tested independently
- **Scalability**: Easy to add new features without affecting existing code
- **Reusability**: Services and utilities can be reused across the application
- **Readability**: Clear structure makes code easy to understand

## ⚡ Performance Optimizations

### Database

1. **Connection Pooling**: 100 max connections, 10 min connections
2. **Indexes**: Compound indexes for common query patterns
3. **Lean Queries**: Using `.lean()` to return plain JavaScript objects
4. **Skip/Limit Pagination**: Efficient pagination with skip/limit parameters
5. **Query Optimization**: Projection and selective field loading

### Application

1. **Clustering**: Utilize all CPU cores with Node.js cluster module
2. **Compression**: Gzip compression for responses
3. **Caching**: Ready for Redis integration
4. **Atomic Operations**: Prevents race conditions
5. **Optimistic Locking**: For standalone MongoDB instances

### Recommendations for 10M req/sec

1. **Horizontal Scaling**: Multiple instances behind load balancer
2. **Database Sharding**: Partition data across multiple MongoDB instances
3. **Read Replicas**: Use secondary nodes for read operations
4. **Redis Caching**: Cache frequently accessed wallet balances
5. **Message Queue**: Use RabbitMQ/Kafka for async processing
6. **CDN**: Serve static assets via CDN

## 🚨 Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/wallet/transact/123"
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `INVALID_INPUT`: Invalid input data
- `INSUFFICIENT_BALANCE`: Insufficient wallet balance
- `WALLET_NOT_FOUND`: Wallet does not exist
- `TRANSACTION_NOT_FOUND`: Transaction does not exist
- `IDEMPOTENCY_KEY_CONFLICT`: Duplicate idempotency key
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `DATABASE_ERROR`: Database connection/query error
- `INTERNAL_SERVER_ERROR`: Unexpected server error

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (idempotency, duplicate)
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable (database issues)

## 🧪 Testing

### Run Tests

```bash
yarn test
```

### Test Structure

- **Unit Tests**: `tests/unit/` - Service layer logic
  - Test individual services in isolation
  - Mock dependencies for clean testing
- **Integration Tests**: `tests/integration/` - API endpoint tests
  - Test full request/response cycle
  - Test with actual database

### Testing Strategy

**Service Layer Testing:**
```javascript
import { processTransaction } from '../services/transactionService.js';
import { checkIdempotency } from '../services/idempotencyService.js';
import { buildTransactionQuery } from '../services/transactionQueryService.js';

describe('Transaction Service', () => {
  it('should process credit transaction', async () => {
    const result = await processTransaction(walletId, 100, 'Test credit');
    expect(result.amount.toString()).toBe('100');
  });
});

describe('Idempotency Service', () => {
  it('should return cached result for duplicate key', async () => {
    const key = 'test-key-123';
    await checkIdempotency(key);
    const cached = await checkIdempotency(key);
    expect(cached).toBeDefined();
  });
});

describe('Transaction Query Service', () => {
  it('should build query with cursor', () => {
    const query = buildTransactionQuery('walletId', 'CREDIT', '2024-01-01', 'desc');
    expect(query.walletId).toBeDefined();
    expect(query.type).toBe('CREDIT');
  });
});
```

**Controller Testing:**
```javascript
import { setupWallet } from '../controllers/walletController.js';
import { mapWalletToResponse } from '../utils/mappers.js';

describe('Wallet Controller', () => {
  it('should create wallet with mapped response', async () => {
    const req = { body: { name: 'Test', balance: 100 } };
    const res = { json: jest.fn() };
    await setupWallet(req, res, () => {});
    expect(res.json).toHaveBeenCalled();
  });
});
```

**Utility Testing:**
```javascript
import { mapWalletToResponse } from '../utils/mappers.js';

describe('Mappers', () => {
  it('should map wallet to response format', () => {
    const wallet = { 
      _id: { toString: () => '123' }, 
      name: 'Test', 
      balance: { toString: () => '100' },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = mapWalletToResponse(wallet);
    expect(result.id).toBe('123');
    expect(result.balance).toBe('100');
  });
});
```

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t wallet-backend .

# Run container
docker run -p 3000:3000 \
  -e MONGO_URL=mongodb://mongo:27017/wallet \
  -e NODE_ENV=production \
  wallet-backend
```

### Environment-Specific Configurations

**Development:**
- Single MongoDB instance
- No clustering
- Verbose logging

**Production:**
- MongoDB replica set
- Clustering enabled
- Error logging only
- Redis for rate limiting
- Load balancer

## 📈 Scaling for Production

### Recommended Infrastructure

1. **Application Servers**: 4-8 instances behind load balancer
2. **Database**: MongoDB replica set (3+ nodes)
3. **Caching**: Redis cluster
4. **Message Queue**: RabbitMQ or Kafka
5. **Monitoring**: APM tools (New Relic, Datadog)
6. **Logging**: ELK stack or CloudWatch

### Performance Targets

- **Throughput**: 10M requests/second
- **Latency**: < 50ms (p95)
- **Availability**: 99.9% uptime
- **Database**: < 10ms query time

### Monitoring

- Database connection pool status
- Request/response times
- Error rates
- Memory and CPU usage
- Database query performance


