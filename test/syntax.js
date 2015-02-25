#!/usr/bin/env node

var assert = require('assert');
var SGF = require('../lib/sgf.js').SGF;

assert.deepEqual(
  SGF.parse(' (\n ;\t FF\r\n [4]  \n\r)\v'),
  [[{ FF: 4 }, []]],
  'SGF.parse: white spaces are ignored'
);

assert.throws(
  function () {
    SGF.parse('(;B[aa]B[bb])');
  },
  SyntaxError,
  'SGF.parse: duplicate property'
);

assert.throws(
  function () {
    SGF.parse('(;B[aa]extra)');
  },
  SyntaxError,
  'SGF.parse: extra characters'
);

assert.throws(
  function () {
    SGF.parse('(B[aa])');
  },
  SyntaxError,
  'SGF.parse: semicolon is missing'
);

// XXX
assert.throws(
  function () {
    SGF.parse('()');
  },
  SyntaxError,
  'SGF.parse: empty GameTree'
);

assert.throws(
  function () {
    SGF.parse('(;B[aa]');
  },
  SyntaxError,
  'SGF.parse: unclosed GameTree'
);

assert.throws(
  function () {
    SGF.parse('(;B)');
  },
  SyntaxError,
  'SGF.parse: PropValue is missing'
);

assert.throws(
  function () {
    SGF.parse('(;B[aa)');
  },
  SyntaxError,
  'SGF.parse: unclosed PropValue'
);

assert.throws(
  function () {
    SGF.parse('(;C[foo [2k]: hi])');
  },
  SyntaxError,
  'SGF.parse: unescaped closing bracket'
);

assert.throws(
  function () {
    SGF.parse('(;FF[4]1NVALID[invalid])');
  },
  SyntaxError,
  'SGF.parse: FF[4]: invalid PropIdent'
);

