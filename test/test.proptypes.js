var test = require('tape');
var FF = require('../sgf.js').FF;

test('FF[1] Number', function (t) {
  var Num = FF[1].TYPES.Number;

  t.equal( Num.name, 'Number' );

  t.equal( Num.parse(['123']), 123 );
  t.equal( Num.parse(['+123']), 123 );
  t.equal( Num.parse(['-123']), -123 );

  t.deepEqual( Num.stringify(123), ['123'] );
  t.deepEqual( Num.stringify(-123), ['-123'] );

  t.throws(
    function () {
      Num.parse(['string']);
    },
    TypeError
  );

  t.throws(
    function () {
      Num.stringify('string');
    },
    TypeError
  );

  t.end();
});

test('FF[1] None', function (t) {
  var None = FF[1].TYPES.None;

  t.equal( None.name, 'None' );
  t.equal( None.parse(['']), null );
  t.deepEqual( None.stringify(null), [''] );

  t.throws(
    function () {
      None.parse(['invalid']);
    },
    TypeError
  );

  t.throws(
    function () {
      None.stringify('invalid');
    },
    TypeError
  );

  t.end();
});

test('FF[1] Real', function (t) {
  var Real = FF[1].TYPES.Real;

  t.equal( Real.name, 'Real' );

  t.equal( Real.parse(['0.5']), 0.5 );
  t.equal( Real.parse(['+0.5']), 0.5 );
  t.equal( Real.parse(['-0.5']), -0.5 );
  t.equal( Real.parse(['0.']), 0 );

  t.deepEqual( Real.stringify(0.5), ['0.5'] );
  t.deepEqual( Real.stringify(-0.5), ['-0.5'] );

  t.throws(
    function () {
      Real.parse(['string']);
    },
    TypeError
  );

  t.throws(
    function () {
      Real.stringify('string');
    },
    TypeError
  );

  t.end();
});

test('FF[1] Triple', function (t) {
  var Triple = FF[1].TYPES.Triple;

  t.equal( Triple.name, 'Triple' );

  t.equal( Triple.parse(['1']), 1 );
  t.equal( Triple.parse(['2']), 2 );

  t.deepEqual( Triple.stringify(1), ['1'] );
  t.deepEqual( Triple.stringify(2), ['2'] );

  t.throws(
    function () {
      Triple.parse(['3']);
    },
    TypeError
  );

  t.throws(
    function () {
      Triple.stringify(3);
    },
    TypeError
  );

  t.end();
});

test('FF[1] Color', function (t) {
  var Color = FF[1].TYPES.Color;

  t.equal( Color.name, 'Color' );

  t.equal( Color.parse(['B']), 'B' );
  t.equal( Color.parse(['W']), 'W' );

  t.deepEqual( Color.stringify('B'), ['B'] );
  t.deepEqual( Color.stringify('W'), ['W'] );

  t.throws(
    function () {
      Color.parse(['BLACK']);
    },
    TypeError
  );

  t.throws(
    function () {
      Color.stringify('BLACK');
    },
    TypeError
  );

  t.end();
});

test('FF[1] Text', function (t) {
  var Text = FF[1].TYPES.Text;

  t.equal( Text.name, 'Text' );
  t.equal( Text.parse(['\\]\\']), ']\\' );
  t.deepEqual( Text.stringify(']\\'), ['\\]\\\\'] );

  t.throws(
    function () {
      Text.parse(['item1', 'item2']);
    },
    TypeError
  );

  t.throws(
    function () {
      Text.stringify(123);
    },
    TypeError
  );

  t.end();
});

test('FF[1] Unknown', function (t) {
  var Unknown = FF[1].TYPES.Unknown;

  t.equal( Unknown.name, 'Unknown' );
  t.deepEqual( Unknown.parse(['\\]']), [']'] );
  t.deepEqual( Unknown.stringify([']']), ['\\]'] );

  t.end();
});

test('FF[4] SimpleText', function (t) {
  var SimpleText = FF[4].TYPES.SimpleText;

  t.equal( SimpleText.name, 'SimpleText' );

  t.equal( SimpleText.parse(['\\]\\:\\\\']), ']:\\' );
  t.equal( SimpleText.parse(['\n|\r|\t|\v']), ' | | | ' );
  t.equal( SimpleText.parse(['\\\n|\\\n\r|\\\r|\\\r\n']), '|||' );

  t.deepEqual( SimpleText.stringify(']:\\'), ['\\]\\:\\\\'] );

  t.throws(
    function () {
      SimpleText.parse(['item1', 'item2']);
    },
    TypeError
  );

  t.throws(
    function () {
      SimpleText.stringify(123);
    },
    TypeError
  );

  t.end();
});

test('FF[4] Text', function (t) {
  var Text = FF[4].TYPES.Text;

  t.equal( Text.name, 'Text' );

  t.equal( Text.parse(['\\]\\:\\\\']), ']:\\' );
  t.equal( Text.parse(['\n|\r|\t|\v']), '\n|\r| | ' );
  t.equal( Text.parse(['\\\n|\\\n\r|\\\r|\\\r\n']), '|||' );

  t.deepEqual( Text.stringify(']:\\'), ['\\]\\:\\\\'] );

  t.throws(
    function () {
      Text.parse(['item1', 'item2']);
    },
    TypeError
  );

  t.throws(
    function () {
      Text.stringify(123);
    },
    TypeError
  );

  t.end();
});

test('FF[4]GM[1] Point', function (t) {
  var Point = FF[4][1].TYPES.Point;

  t.equal( Point.name, 'Point' );

  t.equal( Point.parse(['aa']), 'aa' );
  t.equal( Point.parse(['AA']), 'AA' );

  t.deepEqual( Point.stringify('aa'), ['aa'] );
  t.deepEqual( Point.stringify('AA'), ['AA'] );

  t.throws(
    function () {
      Point.parse(['aa', 'bb']);
    },
    TypeError
  );

  t.throws(
    function () {
      Point.stringify([0, 0]);
    },
    TypeError
  );

  t.end();
});

test('FF[4]GM[1] Move', function (t) {
  var Move = FF[4][1].TYPES.Move;

  t.equal( Move.name, 'Move' );
  t.equal( Move.parse(['']), '' ); // Pass
  t.deepEqual( Move.stringify(''), [''] ); // Pass

  t.end();
});

