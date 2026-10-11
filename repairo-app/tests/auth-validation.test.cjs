const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../src/utils/auth-validation.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = new Module(filename, module); loaded.filename = filename; loaded.paths = module.paths; loaded._compile(compiled.outputText, filename);
const { normalizeAuthPhone, passwordError, validEmail, DEFAULT_PHONE_COUNTRY, DEFAULT_CALLING_CODE } = loaded.exports;
test('default country and calling code are present before asynchronous country loading', () => { assert.equal(DEFAULT_PHONE_COUNTRY, 'IN'); assert.equal(DEFAULT_CALLING_CODE, '+91'); });
test('national input is canonicalized once, including numbers beginning with country-code digits', () => {
  assert.equal(normalizeAuthPhone('9876543210', 'IN'), '+919876543210');
  assert.equal(normalizeAuthPhone('9198765432', 'IN'), '+919198765432');
  assert.equal(normalizeAuthPhone('+91 98765 43210', 'IN'), '+919876543210');
  assert.equal(normalizeAuthPhone('020 7946 0018', 'GB'), '+442079460018');
  assert.equal(normalizeAuthPhone('2025550123', 'US'), '+12025550123');
  assert.equal(normalizeAuthPhone('00919876543210', 'IN'), '+919876543210');
});
test('invalid, empty, duplicate-prefix, and wrong-country input cannot submit', () => {
  for (const input of ['', '+91', '+91+919876543210', '123', 'call 9876543210']) assert.equal(normalizeAuthPhone(input, 'IN'), null);
  assert.equal(normalizeAuthPhone('9876543210', 'invalid'), null);
});
test('password and email validation match backend rules', () => {
  assert.equal(passwordError('a long workshop passphrase'), undefined); assert.ok(passwordError('short')); assert.ok(passwordError(String.fromCodePoint(0x1f600).repeat(19)));
  assert.ok(validEmail(' owner@example.com ')); assert.ok(!validEmail('bad@'));
});
