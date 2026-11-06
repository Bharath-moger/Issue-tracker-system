import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import connectDatabase from './config/database.js';
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  await connectDatabase();
  const server = app.listen(process.env.PORT || 5000, () => console.log('Issue Tracker API started'));
  server.on('error', async () => { console.error('Server failed to listen'); await mongoose.disconnect(); process.exit(1); });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
} catch (error) {
  console.error('Startup failed:', error.name, error.message.startsWith('JWT_SECRET') || error.message === 'MONGODB_URI is required' ? error.message : 'Check database configuration and connectivity');
  await mongoose.disconnect();
  process.exit(1);
}
