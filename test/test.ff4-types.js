var test = require('tape');
var FF = require('../sgfgrove.js').FF;

test('FF[4] Number', function (t) {
  var Num = FF[4].TYPES.Number;

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

test('FF[4] None', function (t) {
  var None = FF[4].TYPES.None;

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

test('FF[4] Double', function (t) {
  var Double = FF[4].TYPES.Double;

  t.equal( Double.name, 'Double' );

  t.equal( Double.parse(['1']), 1 );
  t.equal( Double.parse(['2']), 2 );

  t.deepEqual( Double.stringify(1), ['1'] );
  t.deepEqual( Double.stringify(2), ['2'] );

  t.throws(
    function () {
      Double.parse(['3']);
    },
    TypeError
  );

  t.throws(
    function () {
      Double.stringify(3);
    },
    TypeError
  );

  t.end();
});

test('FF[4] Color', function (t) {
  var Color = FF[4].TYPES.Color;

  t.equal( Color.name, 'Color' );

  t.equal( Color.parse(['B']), 'B' );
  t.equal( Color.parse(['W']), 'W' );

  t.deepEqual( Color.stringify('B'), ['B'] );
  t.deepEqual( Color.stringify('W'), ['W'] );

  t.throws(
    function () {
      Color.parse(['b']);
    },
    TypeError
  );

  t.throws(
    function () {
      Color.stringify('b');
    },
    TypeError
  );

  t.end();
});

test('FF[4] Unknown', function (t) {
  var Unknown = FF[4].TYPES.Unknown;

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
      Point.parse(['']);
    },
    TypeError
  );

  t.throws(
    function () {
      Point.stringify('');
    },
    TypeError
  );

  t.end();
});

test('FF[4]GM[1] Move', function (t) {
  var Move = FF[4][1].TYPES.Move;

  t.equal( Move.name, 'Move' );

  t.equal( Move.parse(['']), null, 'pass' );
  t.deepEqual( Move.stringify(null), [''], 'pass' );

  t.end();
});

test('FF[4]GM[1] list of Point', function (t) {
  var listOfPoint = FF[4][1].TYPES.listOfPoint;

  t.deepEqual( listOfPoint.parse(['aa', 'bb']), ['aa', 'bb'] );

  t.deepEqual(
    listOfPoint.parse(['aa:bb']),
    ['aa', 'ba', 'ab', 'bb'],
    'compressed point list'
  );
  
  t.deepEqual(
    listOfPoint.parse(['bb:aa']),
    ['aa', 'ba', 'ab', 'bb'],
    'compressed point list'
  );

  t.deepEqual(
    listOfPoint.parse(['aa:bb', 'cc']),
    ['aa', 'ba', 'ab', 'bb', 'cc'],
    'compressed point list'
  );

  t.deepEqual( listOfPoint.stringify(['aa', 'bb']), ['aa', 'bb'] );
  t.deepEqual( listOfPoint.stringify(['aa:bb']), ['aa:bb'] );
  t.deepEqual( listOfPoint.stringify(['bb:aa']), ['bb:aa'] );
  t.deepEqual( listOfPoint.stringify(['aa:bb', 'cc']), ['aa:bb', 'cc'] );

  t.throws(
    function () {
      listOfPoint.parse(['']);
    },
    TypeError,
    'can not be empty'
  );

  t.throws(
    function () {
      listOfPoint.stringify([]);
    },
    TypeError,
    'can not be empty'
  );
  
  t.end();
});

