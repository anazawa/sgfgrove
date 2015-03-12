var test = require('tape');
var SGF = require('../sgfgrove.js');

test('SGF.parse: Syntax', function (t) {
  t.deepEqual(
    SGF.parse(' (\n ;\t FF\r\n [4]  \n\r)\v'),
    [[[{ FF: 4 }], []]],
    'white spaces are ignored'
  );

  t.throws(
    function () {
      SGF.parse('(;FF[4]B[aa]B[bb])');
    },
    SyntaxError,
    'duplicate property'
  );

  t.throws(
    function () {
      SGF.parse('(;FF[4]extra)');
    },
    SyntaxError,
    'extra characters'
  );

  t.throws(
    function () {
      SGF.parse('(FF[4])');
    },
    SyntaxError,
    'semicolon is missing'
  );

  t.throws(
    function () {
      SGF.parse('()');
    },
    SyntaxError,
    'empty GameTree'
  );

  t.throws(
    function () {
      SGF.parse('(;FF[4]');
    },
    SyntaxError,
    'unclosed GameTree'
  );

  t.throws(
    function () {
      SGF.parse('(;FF)');
    },
    SyntaxError,
    'PropValue is missing'
  );

  t.throws(
    function () {
      SGF.parse('(;FF[4]B[aa)');
    },
    SyntaxError,
    'unclosed PropValue'
  );

  t.throws(
    function () {
      SGF.parse('(;FF[4]C[foo [2k]: hi])');
    },
    SyntaxError,
    'unescaped closing bracket'
  );

  t.end();
});

test('SGF.parse: Syntax: FF[4]', function (t) {
  t.throws(
    function () {
      SGF.parse('(;FF[4]1NVALID[invalid])');
    },
    SyntaxError,
    'invalid PropIdent'
  );
  t.end();
});


