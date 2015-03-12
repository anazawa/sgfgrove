var test = require('tape');
var FF = require('../sgfgrove.js').FF;

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

