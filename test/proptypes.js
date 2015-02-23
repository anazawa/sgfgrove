#!/usr/local/env node

var assert = require('assert');
var FF = require('../lib/sgf.js').SGF.FF;

assert.equal( FF[4].types.None.name, 'None' );
assert.equal( FF[4].types.None.parse(['']), '' );
assert.deepEqual( FF[4].types.None.stringify(''), [''] );

assert.equal( FF[4].types.Number.name, 'Number' );
assert.equal( FF[4].types.Number.parse(['123']), 123 );
assert.deepEqual( FF[4].types.Number.stringify(123), ['123'] );

assert.equal( FF[4].types.Real.name, 'Real' );
assert.equal( FF[4].types.Real.parse(['0.5']), 0.5 );
assert.deepEqual( FF[4].types.Real.stringify(0.5), ['0.5'] );

assert.equal( FF[4].types.Double.name, 'Double' );
assert.equal( FF[4].types.Double.parse(['1']), 1 );
assert.deepEqual( FF[4].types.Double.stringify(1), ['1'] );

assert.equal( FF[4].types.Color.name, 'Color' );
assert.equal( FF[4].types.Color.parse(['B']), 'B' );
assert.deepEqual( FF[4].types.Color.stringify('B'), ['B'] );

assert.equal( FF[4].types.SimpleText.name, 'SimpleText' );
assert.equal( FF[4].types.SimpleText.parse(['\\]']), ']' );
assert.deepEqual( FF[4].types.SimpleText.stringify(']'), ['\\]'] );

assert.equal( FF[4].types.Text.name, 'Text' );
assert.equal( FF[4].types.Text.parse(['\\]']), ']' );
assert.deepEqual( FF[4].types.Text.stringify(']'), ['\\]'] );

assert.equal( FF[4].types.Unknown.name, 'Unknown' );
assert.deepEqual( FF[4].types.Unknown.parse(['\\]']), [']'] );
assert.deepEqual( FF[4].types.Unknown.stringify([']']), ['\\]'] );

assert.equal( FF[4][1].types.Point.name, 'Point' );
assert.equal( FF[4][1].types.Point.parse(['aa']), 'aa' );
assert.deepEqual( FF[4][1].types.Point.stringify('aa'), ['aa'] );

