import mongoose from 'mongoose';

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});
