import jwt from 'jsonwebtoken';
export default function generateToken(user) {
  return jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '1d', algorithm: 'HS256' });
}
