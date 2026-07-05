'use strict';

const assert = require('assert');
const { assertJson } = require('./assertions');

const body = {
  roles: ['admin', 'user'],
  tags: ['api', 'tram', 'testing'],
  empty: [],
  users: [
    { name: 'Ada', roles: ['admin', 'editor'] },
    { name: 'Linus', roles: ['user'] }
  ]
};

function one(assertion) {
  const results = assertJson(assertion, body);
  assert.strictEqual(results.length, 1, JSON.stringify(results, null, 2));
  return results[0];
}

function expectPass(assertion) {
  const result = one(assertion);
  assert.strictEqual(result.passed, true, result.message);
  console.log(`✓ ${result.message}`);
}

function expectFail(assertion) {
  const result = one(assertion);
  assert.strictEqual(result.passed, false, result.message);
  console.log(`✓ expected failure: ${result.message}`);
}

expectPass({ path: '$.roles', anyOf: ['admin', 'editor'] });
expectFail({ path: '$.roles', anyOf: ['owner', 'editor'] });

expectPass({ path: '$.tags', allOf: ['api', 'tram'] });
expectFail({ path: '$.tags', allOf: ['api', 'missing'] });

expectPass({ path: '$.roles', noneOf: ['banned', 'deleted'] });
expectFail({ path: '$.roles', noneOf: ['banned', 'admin'] });

expectFail({ path: '$.empty', anyOf: ['admin'] });
expectPass({ path: '$.empty', allOf: [] });
expectPass({ path: '$.empty', noneOf: ['admin'] });

expectFail({ path: '$.roles', oneOf: ['admin', 'user'] });
expectPass({ path: '$.roles[0]', oneOf: ['admin', 'user'] });

const eachResults = assertJson(
  {
    path: '$.users',
    each: {
      property: 'roles',
      anyOf: ['admin', 'user']
    }
  },
  body
);

assert.strictEqual(eachResults.length, 2, JSON.stringify(eachResults, null, 2));
assert.strictEqual(eachResults.every((result) => result.passed), true);
console.log('✓ each.property.anyOf works for nested arrays');

console.log('\nAll AnyX burn tests passed.');
