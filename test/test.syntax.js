var test = require('tape');
var SGF = require('../sgf.js');

test('SGF.parse: Syntax', function (t) {
  t.deepEqual(
    SGF.parse(' (\n ;\t FF\r\n [4]  \n\r)\v'),
    [[[{ FF: 4 }], []]],
    'white spaces are ignored'
  );

  t.throws(
    function () {
      SGF.parse('(;B[aa]B[bb])');
    },
    SyntaxError,
    'duplicate property'
  );

  t.throws(
    function () {
      SGF.parse('(;B[aa]extra)');
    },
    SyntaxError,
    'extra characters'
  );

  t.throws(
    function () {
      SGF.parse('(B[aa])');
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
      SGF.parse('(;B[aa]');
    },
    SyntaxError,
    'unclosed GameTree'
  );

  t.throws(
    function () {
      SGF.parse('(;B)');
    },
    SyntaxError,
    'PropValue is missing'
  );

  t.throws(
    function () {
      SGF.parse('(;B[aa)');
    },
    SyntaxError,
    'unclosed PropValue'
  );

  t.throws(
    function () {
      SGF.parse('(;C[foo [2k]: hi])');
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


