'use strict';

const assert = require('node:assert/strict');
const { assertJson } = require('./assertions');

function runCase(name, assertion, body, expectedPassed) {
  const results = assertJson(assertion, body);
  const failed = results.filter((result) => !result.passed);
  const passed = failed.length === 0;

  assert.equal(
    passed,
    expectedPassed,
    `${name}\n${results.map((r) => `  ${r.passed ? '✓' : '✗'} ${r.message}`).join('\n')}`
  );

  console.log(`${passed === expectedPassed ? '✓' : '✗'} ${name}`);
}

runCase(
  'array exact length passes',
  { path: '$.items', length: 3 },
  { items: ['a', 'b', 'c'] },
  true
);

runCase(
  'array exact length fails',
  { path: '$.items', length: 3 },
  { items: ['a', 'b'] },
  false
);

runCase(
  'array min length passes',
  { path: '$.items', length: { min: 2 } },
  { items: ['a', 'b', 'c'] },
  true
);

runCase(
  'array min length fails',
  { path: '$.items', length: { min: 4 } },
  { items: ['a', 'b', 'c'] },
  false
);

runCase(
  'array max length passes',
  { path: '$.items', length: { max: 3 } },
  { items: ['a', 'b', 'c'] },
  true
);

runCase(
  'array max length fails',
  { path: '$.items', length: { max: 2 } },
  { items: ['a', 'b', 'c'] },
  false
);

runCase(
  'array bounded length passes',
  { path: '$.items', length: { min: 2, max: 4 } },
  { items: ['a', 'b', 'c'] },
  true
);

runCase(
  'array bounded length fails below min',
  { path: '$.items', length: { min: 4, max: 6 } },
  { items: ['a', 'b', 'c'] },
  false
);

runCase(
  'array bounded length fails above max',
  { path: '$.items', length: { min: 1, max: 2 } },
  { items: ['a', 'b', 'c'] },
  false
);

runCase(
  'string exact length passes',
  { path: '$.code', length: 2 },
  { code: 'US' },
  true
);

runCase(
  'string exact length fails',
  { path: '$.code', length: 2 },
  { code: 'USA' },
  false
);

runCase(
  'string bounded length passes',
  { path: '$.title', length: { min: 3, max: 10 } },
  { title: 'Milk' },
  true
);

runCase(
  'number length fails',
  { path: '$.count', length: 2 },
  { count: 42 },
  false
);

runCase(
  'object length fails',
  { path: '$.item', length: 2 },
  { item: { id: '1', name: 'Milk' } },
  false
);

runCase(
  'missing path fails',
  { path: '$.missing', length: 1 },
  { items: ['a'] },
  false
);

runCase(
  'each.property string length passes',
  {
    path: '$.items',
    each: {
      property: 'code',
      length: 2
    }
  },
  {
    items: [
      { code: 'US' },
      { code: 'CA' }
    ]
  },
  true
);

runCase(
  'each.property string length fails',
  {
    path: '$.items',
    each: {
      property: 'code',
      length: 2
    }
  },
  {
    items: [
      { code: 'US' },
      { code: 'CAN' }
    ]
  },
  false
);

runCase(
  'existing minLength still passes',
  { path: '$.items', minLength: 2 },
  { items: ['a', 'b', 'c'] },
  true
);

console.log('\nAll length burn tests passed.');
