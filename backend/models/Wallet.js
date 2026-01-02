import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 255,
  },
  balance: { 
    type: mongoose.Schema.Types.Decimal128, 
    required: true,
    default: mongoose.Types.Decimal128.fromString('0'),
  },
}, { 
  timestamps: true,
  // Optimize for read performance - use read preference at query level
  read: 'primary',
  // Optimize collection options
  collection: 'wallets',
});

// Critical indexes for high-scale operations
// Index on _id is automatic, but we optimize for common queries

// Index for sorting by creation date (for admin/reporting queries)
walletSchema.index({ createdAt: -1 });

// Index for name-based queries (if needed for search/admin)
walletSchema.index({ name: 1 }, { 
  sparse: true, // Only index documents with name field
  background: true, // Build in background
});

// Compound index for balance queries (for reporting/analytics)
walletSchema.index({ balance: 1, createdAt: -1 }, { 
  background: true,
  sparse: true,
});

// Text index for name search (if full-text search is needed)
// walletSchema.index({ name: 'text' });

// Optimize queries by default - use lean() in queries for better performance
walletSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.balance = ret.balance ? ret.balance.toString() : '0';
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Virtual for balance as number (for calculations)
walletSchema.virtual('balanceNumber').get(function() {
  return parseFloat(this.balance.toString());
});

// Ensure indexes are created
walletSchema.set('autoIndex', true);

export default mongoose.model('Wallet', walletSchema);
