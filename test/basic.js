#!/usr/bin/env node

var assert = require('assert');
var SGF = require('../lib/sgf.js').SGF;

var text
  = '(;FF[4]C[root]' +
      '(;C[a];C[b]' +
        '(;C[c])' +
        '(;C[d];C[e]))' +
      '(;C[f]' +
        '(;C[g];C[h];C[i])' +
        '(;C[j])))';

var sgf = [[
  { FF: 4, C: 'root' },
  [[
    { C: 'a' }, { C: 'b' },
    [
      [{ C: 'c' }, []],
      [{ C: 'd' }, { C: 'e' }, []],
    ]
  ], [
    { C: 'f' },
    [
      [{ C: 'g' }, { C: 'h' }, { C: 'i' }, []],
      [{ C: 'j' }, []]
    ]
  ]]
]];

assert.deepEqual(
  SGF.parse(text),
  sgf,
  'SGF.parse(text)'
);

assert.deepEqual(
  SGF.parse('(;FF[4])', function (k, v) {
    return k+'['+v+']';
  }),
  [[
    { FF: 'FF[4]' },
    []
  ]],
  'SGF.parse(): reviver should be called'
);

assert.equal(
  SGF.stringify(sgf),
  text,
  'SGF.stringify()'
);

assert.equal(
  SGF.stringify([[
    {
      FF: 4,
      FOO: {
        bar: 'baz',
        toSGF: function () {
          return [this.bar];
        }
      }
    },
    []
  ]]),
  '(;FF[4]FOO[baz])',
  'SGF.stringify(): .toSGF() method should be invoked'
);

