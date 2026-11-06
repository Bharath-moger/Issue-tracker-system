import { execFileSync } from 'node:child_process';
import path from 'node:path';

export default async function setup() {
  const uri = process.env.TEST_MONGODB_URI;
  if (!uri || !/\/issue_tracker_frontend_test(?:\?|$)/.test(uri))
    throw new Error('Unsafe test database');
  // Reuse backend modules only to prepare isolated test records. No backend files are changed.
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import mongoose from './node_modules/mongoose/index.js';
    import User from './src/models/User.js';
    import Issue from './src/models/Issue.js';
    import Comment from './src/models/Comment.js';
    await mongoose.connect(process.env.MONGODB_URI);
    await Promise.all([User.init(), Issue.init(), Comment.init()]);
    await Comment.deleteMany({});
    await Issue.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  `,
    ],
    {
      cwd: path.resolve('../server'),
      env: { ...process.env, MONGODB_URI: uri },
    },
  );
  execFileSync(process.execPath, ['scripts/seed-admin.js'], {
    cwd: path.resolve('../server'),
    env: {
      ...process.env,
      MONGODB_URI: uri,
      ADMIN_NAME: 'Test Admin',
      ADMIN_EMAIL: 'admin@example.test',
      ADMIN_PASSWORD: 'TestPassword123!',
    },
  });
}
