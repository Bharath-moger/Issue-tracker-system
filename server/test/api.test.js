import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Refuse to use an ordinary application database for destructive integration tests.
const uri = process.env.TEST_MONGODB_URI;
if (!uri || !/\/issue_tracker_test(?:[?]|$)/.test(uri)) throw new Error('Set TEST_MONGODB_URI to a database named issue_tracker_test');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-tests-only-secret-32-characters';
process.env.MONGODB_URI = uri;
const { default: app } = await import('../src/app.js');
const { default: connectDatabase } = await import('../src/config/database.js');
const { default: User } = await import('../src/models/User.js');
const { default: Issue } = await import('../src/models/Issue.js');
const { default: Comment } = await import('../src/models/Comment.js');
let server, base;
before(async () => {
  await connectDatabase();
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Issue.init(), Comment.init()]);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
async function request(method, path, body, token, status = 200) {
  const res = await fetch(base + path, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const json = await res.json();
  assert.equal(res.status, status, `${method} ${path}: ${JSON.stringify(json)}`);
  assert.equal(json.success, status < 400);
  assert.equal(JSON.stringify(json).includes('"password"'), false);
  return json.data;
}
test('full backend lifecycle and authorization against MongoDB', async t => {
  let alice, bob, outsider, admin, issue;
  await t.test('health, validation, registration, duplicate emails, login and JWT', async () => {
    await request('GET', '/health');
    await request('GET', '/missing', undefined, undefined, 404);
    await request('POST', '/auth/register', { name: 'Bad', email: 'bad', password: 'x' }, undefined, 400);
    await request('POST', '/auth/register', { name: 'Admin', email: 'hack@example.com', password: 'Password123!', role: 'ADMIN' }, undefined, 400);
    alice = await request('POST', '/auth/register', { name: 'Alice', email: 'ALICE@example.com', password: 'Password123!' }, undefined, 201);
    bob = await request('POST', '/auth/register', { name: 'Bob', email: 'bob@example.com', password: 'Password123!' }, undefined, 201);
    outsider = await request('POST', '/auth/register', { name: 'Other', email: 'other@example.com', password: 'Password123!' }, undefined, 201);
    assert.equal(alice.user.role, 'USER');
    const stored = await User.findById(alice.user._id).select('+password');
    assert.notEqual(stored.password, 'Password123!');
    assert.equal(await bcrypt.compare('Password123!', stored.password), true);
    await request('POST', '/auth/register', { name: 'Duplicate', email: 'alice@example.com', password: 'Password123!' }, undefined, 409);
    await request('POST', '/auth/login', { email: 'alice@example.com', password: 'wrong' }, undefined, 401);
    alice = await request('POST', '/auth/login', { email: 'alice@example.com', password: 'Password123!' });
    await request('GET', '/auth/me', undefined, alice.token);
    await request('GET', '/auth/me', undefined, undefined, 401);
    await request('GET', '/auth/me', undefined, 'invalid', 401);
  });
  await t.test('admin seed is repeatable and admin authentication works', async () => {
    const env = { ...process.env, ADMIN_NAME: 'Admin', ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'AdminPassword123!' };
    for (let i = 0; i < 2; i++) execFileSync(process.execPath, ['scripts/seed-admin.js'], { cwd: new URL('..', import.meta.url), env });
    assert.equal(await User.countDocuments({ role: 'ADMIN' }), 1);
    admin = await request('POST', '/auth/login', { email: 'admin@example.com', password: 'AdminPassword123!' });
  });
  await t.test('admin-only user management and reference protection', async () => {
    await request('GET', '/users', undefined, alice.token, 403);
    await request('GET', '/users', undefined, admin.token);
    await request('GET', `/users/${bob.user._id}`, undefined, admin.token);
    await request('PATCH', `/users/${bob.user._id}`, { name: 'Bob Updated' }, admin.token);
    await request('PATCH', `/users/${bob.user._id}`, { role: 'ADMIN' }, admin.token, 400);
    await request('DELETE', `/users/${admin.user._id}`, undefined, admin.token, 409);
    const temporary = await request('POST', '/auth/register', { name: 'Temporary', email: 'temp@example.com', password: 'Password123!' }, undefined, 201);
    await request('DELETE', `/users/${temporary.user._id}`, undefined, admin.token);
    await request('GET', '/auth/me', undefined, temporary.token, 401);
    await request('GET', '/users/bad-id', undefined, admin.token, 400);
    await request('GET', '/users/000000000000000000000000', undefined, admin.token, 404);
  });
  await t.test('issue creation, scoped listing, filters, pagination and literal search', async () => {
    await request('POST', '/issues', { title: 'Forbidden', description: 'Assignment', assignedTo: bob.user._id }, alice.token, 403);
    await request('POST', '/issues', { title: 'Bad', description: 'Status', status: 'CLOSED' }, alice.token, 400);
    issue = await request('POST', '/issues', { title: 'Fix [power].*', description: 'Power issue', priority: 'HIGH' }, alice.token, 201);
    assert.equal(issue.status, 'OPEN');
    assert.equal(issue.createdBy._id, alice.user._id);
    await request('POST', '/issues', { title: 'Other issue', description: 'Other issue' }, outsider.token, 201);
    const listing = await request('GET', '/issues?page=1&limit=1&status=OPEN&priority=HIGH', undefined, alice.token);
    assert.equal(listing.totalRecords, 1);
    assert.equal(listing.totalPages, 1);
    assert.equal((await request('GET', '/issues?search=%5Bpower%5D.*', undefined, alice.token)).totalRecords, 1);
    assert.equal((await request('GET', '/issues?search=%5E', undefined, alice.token)).totalRecords, 0);
    assert.equal((await request('GET', '/issues', undefined, admin.token)).totalRecords, 2);
    await request('GET', '/issues?page=0', undefined, alice.token, 400);
    await request('GET', '/issues?assignedTo=bad', undefined, alice.token, 400);
  });
  await t.test('issue ownership, status permissions, assignment and mass assignment rejection', async () => {
    await request('GET', `/issues/${issue._id}`, undefined, outsider.token, 403);
    await request('PATCH', `/issues/${issue._id}`, { title: 'Unauthorized' }, bob.token, 403);
    await request('PATCH', `/issues/${issue._id}`, { description: 'Updated description' }, alice.token);
    await request('PATCH', `/issues/${issue._id}`, { createdBy: bob.user._id }, alice.token, 400);
    await request('PATCH', `/issues/${issue._id}`, { assignedTo: bob.user._id }, admin.token, 400);
    await request('PATCH', `/issues/${issue._id}/status`, { status: 'CLOSED' }, alice.token, 403);
    await request('PATCH', `/issues/${issue._id}/assign`, { assignedTo: bob.user._id }, alice.token, 403);
    await request('PATCH', `/issues/${issue._id}/assign`, { assignedTo: admin.user._id }, admin.token, 400);
    await request('PATCH', `/issues/${issue._id}/assign`, { assignedTo: '000000000000000000000000' }, admin.token, 400);
    await request('PATCH', `/issues/${issue._id}/assign`, { assignedTo: 'bad' }, admin.token, 400);
    await request('PATCH', `/issues/${issue._id}/assign`, { assignedTo: bob.user._id }, admin.token);
    await request('GET', `/issues/${issue._id}`, undefined, bob.token);
    await request('PATCH', `/issues/${issue._id}`, { title: 'Assignee edit' }, bob.token, 403);
    await request('PATCH', `/issues/${issue._id}/status`, { status: 'IN_PROGRESS' }, bob.token);
    await request('PATCH', `/issues/${issue._id}/status`, { status: 'INVALID' }, admin.token, 400);
    await request('DELETE', `/users/${bob.user._id}`, undefined, admin.token, 409);
    assert.equal((await request('GET', `/issues?assignedTo=${bob.user._id}`, undefined, admin.token)).totalRecords, 1);
  });
  await t.test('comments require issue access and include safe author details', async () => {
    await request('GET', `/issues/${issue._id}/comments`, undefined, outsider.token, 403);
    await request('POST', `/issues/${issue._id}/comments`, { content: 'intrusion' }, outsider.token, 403);
    await request('POST', `/issues/${issue._id}/comments`, { content: '   ' }, alice.token, 400);
    const comment = await request('POST', `/issues/${issue._id}/comments`, { content: ' Working on it ' }, bob.token, 201);
    assert.equal(comment.content, 'Working on it');
    assert.equal(comment.user.name, 'Bob Updated');
    assert.ok(comment.createdAt);
    assert.equal((await request('GET', `/issues/${issue._id}/comments`, undefined, alice.token)).length, 1);
    await request('PATCH', `/issues/${issue._id}/comments/${comment._id}`, { content: 'tamper' }, alice.token, 404);
  });
  await t.test('dashboard counts, unassignment, admin status and deletion cleanup', async () => {
    assert.deepEqual(await request('GET', '/dashboard/stats', undefined, bob.token), { totalIssues: 1, openIssues: 0, inProgressIssues: 1, closedIssues: 0, myAssignedIssues: 1 });
    assert.equal((await request('GET', '/dashboard/stats', undefined, admin.token)).totalIssues, 2);
    await request('PATCH', `/issues/${issue._id}/status`, { status: 'CLOSED' }, admin.token);
    assert.equal((await request('GET', '/dashboard/stats', undefined, alice.token)).closedIssues, 1);
    await request('PATCH', `/issues/${issue._id}/assign`, { assignedTo: null }, admin.token);
    await request('GET', `/issues/${issue._id}`, undefined, bob.token, 403);
    await request('DELETE', `/users/${bob.user._id}`, undefined, admin.token, 409);
    await request('DELETE', `/issues/${issue._id}`, undefined, alice.token, 403);
    await request('DELETE', `/issues/${issue._id}`, undefined, admin.token);
    assert.equal(await Comment.countDocuments({ issue: issue._id }), 0);
    await request('GET', `/issues/${issue._id}`, undefined, alice.token, 404);
    await request('DELETE', `/users/${bob.user._id}`, undefined, admin.token);
    await request('DELETE', `/users/${outsider.user._id}`, undefined, admin.token, 409);
  });
});
