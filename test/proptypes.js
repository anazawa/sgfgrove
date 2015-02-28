#!/usr/local/env node

var assert = require('assert');

var FF = require('../lib/sgf.js').SGF.FF;

var FF1   = FF[1].TYPES;
var FF1_1 = FF[1][1].TYPES;

var FF3   = FF[1].TYPES;
var FF3_1 = FF[1][1].TYPES;

var FF4   = FF[4].TYPES;
var FF4_1 = FF[4][1].TYPES;

/*
 * FF[1] Number
 */

assert.equal( FF1.Number.name, 'Number' );

assert.equal( FF1.Number.parse(['123']), 123 );
assert.equal( FF1.Number.parse(['+123']), 123 );
assert.equal( FF1.Number.parse(['-123']), -123 );

assert.deepEqual( FF1.Number.stringify(123), ['123'] );
assert.deepEqual( FF1.Number.stringify(-123), ['-123'] );

assert.throws(
  function () {
    FF1.Number.parse(['string']);
  },
  TypeError
);

assert.throws(
  function () {
    FF1.Number.stringify('string');
  },
  TypeError
);

/*
 * FF[1] None
 */

assert.equal( FF1.None.name, 'None' );
assert.equal( FF1.None.parse(['']), '' );
assert.deepEqual( FF1.None.stringify(''), [''] );

assert.throws(
  function () {
    FF1.None.parse(['invalid']);
  },
  TypeError
);

assert.throws(
  function () {
    FF1.None.stringify('invalid');
  },
  TypeError
);

/*
 * FF[1] Real
 */

assert.equal( FF1.Real.name, 'Real' );

assert.equal( FF1.Real.parse(['0.5']), 0.5 );
assert.equal( FF1.Real.parse(['+0.5']), 0.5 );
assert.equal( FF1.Real.parse(['-0.5']), -0.5 );
assert.equal( FF1.Real.parse(['0.']), 0 );

assert.deepEqual( FF1.Real.stringify(0.5), ['0.5'] );
assert.deepEqual( FF1.Real.stringify(-0.5), ['-0.5'] );

assert.throws(
  function () {
    FF1.Real.parse(['string']);
  },
  TypeError
);

assert.throws(
  function () {
    FF1.Real.stringify('string');
  },
  TypeError
);

/*
 * FF[1] Triple
 */

assert.equal( FF1.Triple.name, 'Triple' );

assert.equal( FF1.Triple.parse(['1']), 1 );
assert.equal( FF1.Triple.parse(['2']), 2 );

assert.deepEqual( FF1.Triple.stringify(1), ['1'] );
assert.deepEqual( FF1.Triple.stringify(2), ['2'] );

assert.throws(
  function () {
    FF1.Triple.parse(['3']);
  },
  TypeError
);

assert.throws(
  function () {
    FF1.Triple.stringify(3);
  },
  TypeError
);

/*
 * FF[1] Color
 */

assert.equal( FF1.Color.name, 'Color' );

assert.equal( FF1.Color.parse(['B']), 'B' );
assert.equal( FF1.Color.parse(['W']), 'W' );

assert.deepEqual( FF1.Color.stringify('B'), ['B'] );
assert.deepEqual( FF1.Color.stringify('W'), ['W'] );

assert.throws(
  function () {
    FF1.Color.parse(['BLACK']);
  },
  TypeError
);

assert.throws(
  function () {
    FF1.Color.stringify('BLACK');
  },
  TypeError
);

/*
 * FF[1] Text
 */

assert.equal( FF1.Text.name, 'Text' );
assert.equal( FF1.Text.parse(['\\]\\']), ']\\' );
assert.deepEqual( FF1.Text.stringify(']\\'), ['\\]\\\\'] );

assert.throws(
  function () {
    FF1.Text.parse(['item1', 'item2']);
  },
  TypeError
);

assert.throws(
  function () {
    FF1.Text.stringify(123);
  },
  TypeError
);

assert.equal( FF1.Unknown.name, 'Unknown' );
assert.deepEqual( FF1.Unknown.parse(['\\]']), [']'] );
assert.deepEqual( FF1.Unknown.stringify([']']), ['\\]'] );

/*
 * FF[4] SimpleText
 */

assert.equal( FF4.SimpleText.name, 'SimpleText' );

assert.equal( FF4.SimpleText.parse(['\\]\\:\\\\']), ']:\\' );
assert.equal( FF4.SimpleText.parse(['\n|\r|\t|\v']), ' | | | ' );
assert.equal( FF4.SimpleText.parse(['\\\n|\\\n\r|\\\r|\\\r\n']), '|||' );

assert.deepEqual( FF4.SimpleText.stringify(']:\\'), ['\\]\\:\\\\'] );

assert.throws(
  function () {
    FF4.SimpleText.parse(['item1', 'item2']);
  },
  TypeError
);

assert.throws(
  function () {
    FF4.SimpleText.stringify(123);
  },
  TypeError
);

/*
 * FF[4] Text
 */

assert.equal( FF4.Text.name, 'Text' );

assert.equal( FF4.Text.parse(['\\]\\:\\\\']), ']:\\' );
assert.equal( FF4.Text.parse(['\n|\r|\t|\v']), '\n|\r| | ' );
assert.equal( FF4.Text.parse(['\\\n|\\\n\r|\\\r|\\\r\n']), '|||' );

assert.deepEqual( FF4.Text.stringify(']:\\'), ['\\]\\:\\\\'] );

assert.throws(
  function () {
    FF4.Text.parse(['item1', 'item2']);
  },
  TypeError
);

assert.throws(
  function () {
    FF4.Text.stringify(123);
  },
  TypeError
);

/*
 * FF[4]GM[1] Point
 */

assert.equal( FF4_1.Point.name, 'Point' );

assert.equal( FF4_1.Point.parse(['aa']), 'aa' );
assert.equal( FF4_1.Point.parse(['AA']), 'AA' );

assert.deepEqual( FF4_1.Point.stringify('aa'), ['aa'] );
assert.deepEqual( FF4_1.Point.stringify('AA'), ['AA'] );

assert.throws(
  function () {
    FF4_1.Point.parse(['aa', 'bb']);
  },
  TypeError
);

assert.throws(
  function () {
    FF4_1.Point.stringify([0, 0]);
  },
  TypeError
);

/*
 * FF[4]GM[1] Move
 */

assert.equal( FF4_1.Move.name, 'Move' );
assert.equal( FF4_1.Move.parse(['']), '' ); // Pass
assert.deepEqual( FF4_1.Move.stringify(''), [''] ); // Pass
