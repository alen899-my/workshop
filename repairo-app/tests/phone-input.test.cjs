const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../src/components/ui/PhoneInputWithCode.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded.require = name => {
  if (name === 'react') return { useCallback: fn => fn, useMemo: fn => fn(), useState: value => [value, () => {}], useEffect: () => {} };
  if (name === 'react-native') return { FlatList: 'FlatList', Keyboard: { dismiss() {} }, Pressable: 'Pressable', Text: 'Text', TextInput: 'TextInput', View: 'View', StyleSheet: { create: value => value } };
  if (name === '@expo/vector-icons') return { MaterialCommunityIcons: 'Icon' };
  if (name === '@/components/ui/ModalSheet') return { default: 'ModalSheet' };
  if (name === '@/constants/theme') return { UI: {}, Spacing: {} };
  if (name === '@/hooks/use-theme') return { useTheme: () => ({}) };
  if (name === '@/utils/preload-countries') return { getCallingCode: code => code === 'IN' ? '+91' : '+44', countriesCache: {}, waitForCountries: async () => {} };
  return require(name);
};
loaded._compile(compiled.outputText, filename);
function find(node, type) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const found = find(child, type);
    if (found) return found;
  }
  return null;
}
function render(overrides = {}) {
  const phones = [], countries = [];
  const root = loaded.exports.default({ countryCode: 'IN', callingCode: '+91', phone: '', valueFormat: 'national', onPhoneChange: p => phones.push(p), onCountryChange: c => countries.push(c), ...overrides });
  return { input: find(root, 'TextInput'), list: find(root, 'FlatList'), phones, countries };
}
test('national input retains digits matching the calling code and emits no prefix', () => {
  const view = render({ phone: '9198765432' });
  assert.equal(view.input.props.value, '9198765432');
  view.input.props.onChangeText('91987 65432');
  assert.deepEqual(view.phones, ['9198765432']);
});
test('pasting an international phone selects its country and emits national digits', () => {
  const view = render();
  view.input.props.onChangeText('+44 20 7946 0018');
  assert.equal(view.countries[0].cca2, 'GB');
  assert.equal(view.countries[0].callingCode, '+44');
  assert.deepEqual(view.phones, ['2079460018']);
});
test('clearing international input produces an empty value, not just a prefix', () => {
  const view = render({ valueFormat: 'international', phone: '+919876543210' });
  view.input.props.onChangeText('');
  assert.deepEqual(view.phones, ['']);
});
test('existing international forms replace the prefix on country changes', () => {
  const view = render({ valueFormat: 'international', phone: '+919876543210' });
  const row = view.list.props.renderItem({ item: { cca2: 'GB', name: 'United Kingdom', callingCode: ['44'], currency: ['GBP'] } });
  row.props.onPress();
  assert.deepEqual(view.phones, ['+449876543210']);
});
test('malformed international input remains visible for validation', () => {
  const view = render();
  view.input.props.onChangeText('+91+919876543210');
  assert.deepEqual(view.phones, ['+91+919876543210']);
});
