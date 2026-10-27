import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'test-secret-for-unit-tests';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/imovies-unit-test';

const { signToken, verifyToken } = await import('../src/utils/token.js');

test('signToken embeds the user id and role', () => {
  const token = signToken({ id: 'user-123', role: 'admin' });
  const payload = verifyToken(token);

  assert.equal(payload.sub, 'user-123');
  assert.equal(payload.role, 'admin');
  assert.ok(payload.exp > Math.floor(Date.now() / 1000));
});

test('verifyToken rejects a tampered token', () => {
  const token = signToken({ id: 'user-123', role: 'customer' });
  const tampered = `${token.slice(0, -3)}abc`;

  assert.throws(() => verifyToken(tampered));
});

test('verifyToken rejects a token signed with another secret', async () => {
  const jwt = await import('jsonwebtoken');
  const token = jwt.default.sign({ sub: 'user-123', role: 'customer' }, 'other-secret');

  assert.throws(() => verifyToken(token));
});
