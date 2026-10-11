const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
let values, result, tokenFailure, redirects;
const storage = {
  getItemAsync: async key => values.get(key) || null,
  setItemAsync: async (key, value) => { values.set(key, value); },
  deleteItemAsync: async key => { values.delete(key); },
};
const apiModule = {
  api: { get: async () => result, post: async () => result },
  setUnauthorizedHandler: () => {},
  getStoredToken: async () => values.get('repairo_token') || null,
  setToken: async token => { if (token && tokenFailure) throw new Error('storage unavailable'); if (token) values.set('repairo_token', token); else values.delete('repairo_token'); },
};
const filename = path.resolve(__dirname, '../src/services/auth.service.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = new Module(filename, module); loaded.filename = filename; loaded.paths = module.paths;
loaded.require = name => {
  if (name === '@/services/storage') return storage;
  if (name === './api') return apiModule;
  if (name === '@/utils/preload-countries') return { getCallingCode: () => '+91' };
  if (name === 'expo-router') return { router: { replace: target => redirects.push(target) } };
  return require(name);
};
loaded._compile(compiled.outputText, filename);
const { authService, getCurrentUser, loadStoredUser } = loaded.exports;
beforeEach(async () => { values = new Map(); result = {}; tokenFailure = false; redirects = []; await authService.logout(); });
test('signup does not persist a temporary session', async () => {
  result = { success: true, token: 'temporary', data: { userId: 1 } };
  await authService.register({}); assert.equal(values.size, 0); assert.equal(getCurrentUser(), null);
});
test('malformed successful login response cannot authenticate', async () => {
  result = { success: true, data: { userId: 1 } };
  await assert.rejects(authService.login('+919876543210', 'password')); assert.equal(values.size, 0);
});
test('failed token persistence rolls back stored identity', async () => {
  result = { success: true, token: 'token', data: { userId: 1 } }; tokenFailure = true;
  await assert.rejects(authService.login('+919876543210', 'password'));
  assert.equal(values.size, 0); assert.equal(getCurrentUser(), null);
});
test('successful login persists identity and token; logout clears both', async () => {
  result = { success: true, token: 'token', data: { userId: 1, shopCountry: 'IN' } };
  await authService.login('+919876543210', 'password'); assert.equal(getCurrentUser().shopCallingCode, '+91'); assert.equal(values.get('repairo_token'), 'token');
  await authService.logout(); assert.equal(values.size, 0); assert.equal(getCurrentUser(), null);
});
test('expired sessions clear storage; connectivity failures keep it for retry', async () => {
  values.set('repairo_token', 'expired'); values.set('repairo_user', JSON.stringify({ userId: 1 })); result = { success: false, status: 401 };
  assert.equal(await authService.restoreSession(), false); assert.equal(values.size, 0);
  values.set('repairo_token', 'valid'); result = { success: false, status: 503, error: 'Try again' };
  await assert.rejects(authService.restoreSession()); assert.equal(values.get('repairo_token'), 'valid');
});
test('loading missing storage clears a cached prior user', async () => {
  result = { success: true, token: 'token', data: { userId: 1 } }; await authService.login('+919876543210', 'password');
  values.clear(); assert.equal(await loadStoredUser(), null); assert.equal(getCurrentUser(), null);
});
