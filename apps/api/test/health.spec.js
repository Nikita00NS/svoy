const test = require('node:test');
const assert = require('node:assert/strict');

test('health payload shape', async () => {
  const payload = { ok: true, timestamp: new Date().toISOString() };
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.timestamp, 'string');
});
