import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import connectDatabase from '../src/config/database.js';
try {
  await connectDatabase();
  await User.init();
  if (await User.exists({ role: 'ADMIN' })) console.log('Admin already exists; no changes made');
  else {
    const { ADMIN_NAME: name, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
    if (!name?.trim() || !email || !password || password.length < 8 || Buffer.byteLength(password) > 72) throw new Error('Invalid admin configuration');
    if (await User.exists({ email: email.trim().toLowerCase() })) throw new Error('Admin email is already registered');
    await User.create({ name, email, password, role: 'ADMIN' });
    console.log('Admin created successfully');
  }
} catch { console.error('Admin seed failed; check configuration, email availability and database connectivity'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
