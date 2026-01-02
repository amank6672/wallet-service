import request from 'supertest';
import app from '../../app.js';
import mongoose from 'mongoose';

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

test('setup wallet API', async () => {
  const res = await request(app)
    .post('/setup')
    .send({ name: 'Wallet A', balance: 10 });

  expect(res.body.balance).toBe(10);
});
