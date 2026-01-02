import mongoose from 'mongoose';

const idempotencySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['processing', 'done', 'failed'],
    required: true,
    index: true,
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: 24 hours - auto-delete after 24 hours
  },
}, {
  timestamps: true,
});

// Compound index for faster lookups
idempotencySchema.index({ key: 1, status: 1 });

export default mongoose.model('Idempotency', idempotencySchema);

