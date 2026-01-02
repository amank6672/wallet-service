# Backend Architecture - DAO Pattern

## Overview

The backend now uses the **DAO (Data Access Object)** pattern to separate data access logic from business logic. This provides better maintainability, testability, and scalability.

## Architecture Layers

```
Controllers (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
DAOs (Data Access Layer)
    ↓
Models (Mongoose Schemas)
    ↓
Database (MongoDB)
```

## Benefits of DAO Pattern

### 1. **Separation of Concerns**
- **Services**: Focus on business logic, validation, orchestration
- **DAOs**: Handle all database operations, query optimization
- **Models**: Define schema and structure

### 2. **Centralized Query Optimization**
- All database queries in one place (DAOs)
- Easy to optimize queries without touching business logic
- Consistent query patterns across the application

### 3. **Easier Caching Integration**
- Add caching layer at DAO level
- Services don't need to know about caching
- Can cache at method level (e.g., `walletDAO.findById`)

### 4. **Read Replica Support**
- DAOs handle read/write routing
- Services don't need to know about replica sets
- Automatic read replica usage for read operations

### 5. **Better Testability**
- Mock DAOs instead of mocking Mongoose
- Easier unit testing of services
- Test data access logic separately

### 6. **Future-Proofing**
- Easy to swap database (e.g., MongoDB → PostgreSQL)
- Easy to add features (caching, sharding logic)
- Easy to add monitoring/metrics at DAO level

## DAO Structure

### `walletDAO.js`
- `findById(walletId, options)` - Get wallet by ID
- `create(walletData, options)` - Create new wallet
- `updateBalance(walletId, currentBalance, newBalance, options)` - Update balance atomically
- `exists(walletId)` - Check if wallet exists
- `findByIds(walletIds, options)` - Batch find by IDs

### `transactionDAO.js`
- `find(query, options)` - Find transactions with pagination
- `create(transactionData, options)` - Create new transaction
- `count(query, options)` - Count transactions
- `findById(transactionId, options)` - Find by ID
- `findByWalletIds(walletIds, options)` - Batch find by wallet IDs
- `getIndexHint(params)` - Get optimal index hint

### `idempotencyDAO.js`
- `create(key, status, options)` - Create idempotency record
- `findByKey(key, options)` - Find by key
- `update(key, update, options)` - Update record

## Usage Example

### Before (Direct Model Access)
```javascript
// In service
const wallet = await Wallet.findById(walletId)
  .select('name balance')
  .lean()
  .maxTimeMS(5000);
```

### After (Using DAO)
```javascript
// In service
const wallet = await walletDAO.findById(walletId, {
  useReadReplica: true,
});
```

## Key Features

### 1. **Automatic Read Replica Routing**
```javascript
// DAO automatically routes to read replica
const wallet = await walletDAO.findById(walletId, {
  useReadReplica: true, // Uses secondary if available
});
```

### 2. **Session Support**
```javascript
// DAO handles session propagation
const wallet = await walletDAO.findById(walletId, {
  session: mongoSession,
});
```

### 3. **Query Optimization**
```javascript
// DAO provides index hints
const indexHint = transactionDAO.getIndexHint({
  walletId,
  type,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

const transactions = await transactionDAO.find(query, {
  indexHint,
  useReadReplica: true,
});
```

### 4. **Consistent Error Handling**
- All DAOs use `logDbOperation` for timing
- Consistent timeout handling
- Proper error propagation

## Migration Path

All existing code continues to work. Services have been refactored to use DAOs:

- ✅ `walletService.js` - Uses `walletDAO` and `transactionDAO`
- ✅ `transactionService.js` - Uses `walletDAO` and `transactionDAO`
- ✅ `idempotencyService.js` - Uses `idempotencyDAO`

## Future Enhancements

### 1. **Caching Layer**
```javascript
// Easy to add caching at DAO level
async findById(walletId, options) {
  // Check cache first
  const cached = await cache.get(`wallet:${walletId}`);
  if (cached) return cached;
  
  // Fetch from database
  const wallet = await Wallet.findById(walletId).lean();
  
  // Cache result
  await cache.set(`wallet:${walletId}`, wallet, 300);
  
  return wallet;
}
```

### 2. **Query Result Caching**
```javascript
// Cache frequently accessed queries
async find(query, options) {
  const cacheKey = `transactions:${JSON.stringify(query)}`;
  // ... caching logic
}
```

### 3. **Batch Operations**
```javascript
// Optimize batch operations
async findByIds(walletIds) {
  // Use $in query or batch processing
  // Add connection pooling optimization
}
```

### 4. **Sharding Logic**
```javascript
// Add sharding at DAO level
async findById(walletId) {
  const shard = getShardForWallet(walletId);
  return await Wallet.shard(shard).findById(walletId);
}
```

## Testing

### Mock DAOs in Tests
```javascript
// Easy to mock DAOs
jest.mock('../daos/walletDAO.js', () => ({
  findById: jest.fn(),
  create: jest.fn(),
}));

// Test service logic without database
const wallet = await walletService.getWallet(walletId);
```

## Performance Benefits

1. **Centralized Optimization**: All queries optimized in one place
2. **Read Replica Routing**: Automatic load distribution
3. **Query Hints**: Optimal index usage
4. **Consistent Timeouts**: Prevents hanging queries
5. **Lean Queries**: All queries use `.lean()` by default

## Best Practices

1. **Always use DAOs** - Never access models directly from services
2. **Use read replicas** - Set `useReadReplica: true` for read operations
3. **Pass sessions** - For transactions, pass session to DAO
4. **Use index hints** - For complex queries, use `getIndexHint()`
5. **Handle errors** - DAOs throw errors, services handle them

## Conclusion

The DAO pattern provides a clean separation of concerns and makes the codebase more maintainable, testable, and scalable. It's especially beneficial for high-scale systems where query optimization and caching are critical.

