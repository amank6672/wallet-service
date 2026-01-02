import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  amount: mongoose.Schema.Types.Decimal128,
  balance: mongoose.Schema.Types.Decimal128,
  description: String,
  type: { type: String, enum: ['CREDIT', 'DEBIT'] }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
