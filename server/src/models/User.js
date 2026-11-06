import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
}, { timestamps: true, toJSON: { transform(_doc, ret) { delete ret.password; return ret; } } });
schema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
export default mongoose.model('User', schema);
