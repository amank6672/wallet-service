import mongoose from 'mongoose';
import { transact } from '../../services/walletService.js';
import Wallet from '../../models/Wallet.js';

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

test('credits wallet correctly', async () => {
  const wallet = await Wallet.create({ name: 'Test', balance: 10 });

  const tx = await transact(wallet._id, 5, 'Recharge');

  expect(Number(tx.balance)).toBe(15);
});
