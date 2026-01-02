import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  walletId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wallet',
    required: true,
    index: true, // Single field index for walletId
  },
  amount: { 
    type: mongoose.Schema.Types.Decimal128, 
    required: true,
  },
  balance: { 
    type: mongoose.Schema.Types.Decimal128, 
    required: true,
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  type: { 
    type: String, 
    enum: ['CREDIT', 'DEBIT'],
    required: true,
    index: true, // Single field index for type
  },
}, { 
  timestamps: true,
  // Optimize for read performance
  read: 'primary',
  // Optimize collection options
  collection: 'transactions',
});

// CRITICAL COMPOUND INDEXES for high-scale queries
// These indexes are essential for handling millions of transactions per user

// Most common query: Get transactions for a wallet, sorted by date (newest first)
// This is the PRIMARY index for transaction listing
transactionSchema.index({ 
  walletId: 1, 
  createdAt: -1 
}, {
  name: 'walletId_createdAt_desc',
  background: true,
});

// Query: Get transactions for a wallet, sorted by date (oldest first)
transactionSchema.index({ 
  walletId: 1, 
  createdAt: 1 
}, {
  name: 'walletId_createdAt_asc',
  background: true,
});

// Query: Filter by wallet and type, sorted by date
transactionSchema.index({ 
  walletId: 1, 
  type: 1, 
  createdAt: -1 
}, {
  name: 'walletId_type_createdAt_desc',
  background: true,
});

// Query: Filter by wallet and type, sorted by date (ascending)
transactionSchema.index({ 
  walletId: 1, 
  type: 1, 
  createdAt: 1 
}, {
  name: 'walletId_type_createdAt_asc',
  background: true,
});

// Cursor-based pagination optimization: walletId + _id for efficient cursor navigation
transactionSchema.index({ 
  walletId: 1, 
  _id: 1,
  createdAt: -1 
}, {
  name: 'walletId_id_createdAt_desc',
  background: true,
});

// Global sorting by date (for admin/reporting queries across all wallets)
transactionSchema.index({ 
  createdAt: -1 
}, {
  name: 'createdAt_desc',
  background: true,
});

// Index for amount-based queries (for analytics/reporting)
transactionSchema.index({ 
  walletId: 1, 
  amount: 1,
  createdAt: -1 
}, {
  name: 'walletId_amount_createdAt_desc',
  background: true,
  sparse: true,
});

// TTL index for automatic cleanup of old transactions (optional - uncomment if needed)
// transactionSchema.index({ createdAt: 1 }, { 
//   expireAfterSeconds: 31536000, // 1 year in seconds
//   background: true,
// });

// Optimize queries by default
transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.amount = ret.amount ? ret.amount.toString() : '0';
    ret.balance = ret.balance ? ret.balance.toString() : '0';
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Virtual for amount as number (for calculations)
transactionSchema.virtual('amountNumber').get(function() {
  return parseFloat(this.amount.toString());
});

// Virtual for balance as number
transactionSchema.virtual('balanceNumber').get(function() {
  return parseFloat(this.balance.toString());
});

// Ensure indexes are created
transactionSchema.set('autoIndex', true);

export default mongoose.model('Transaction', transactionSchema);
