#!/usr/bin/env node

var fs = require('fs');
var assert = require('assert');
var Benchmark = require('benchmark');

var parse = (function () {
    var text, at, ch;

    var collection = function (t) {
      var trees = [];

      text = t;
      at = 0;
      ch = text.charAt(at);

      whiteSpaces();

      while ( ch === '(' ) { // start of GameTree
        trees.push( gameTree() );
      }

      if ( ch ) {
        throw new SyntaxError( "Unexpected token '"+ch+"'" );
      }

      return trees;
    };

    var gameTree = function () {
      var tree = [];
      var subtrees = [];

      next('('); // start of GameTree

      whiteSpaces();

      while ( ch === ';' ) { // start of Node
        tree.push( node() );
      }

      if ( !tree.length ) {
        throw new SyntaxError( 'GameTree must contain at least one Node' );
      }

      while ( ch === '(' ) { // start of sub GameTree (variations)
        subtrees.push( gameTree() );
      }

      tree.push( subtrees );

      next(')'); // end of GameTree

      whiteSpaces();

      return tree;
    };

    var node = function () {
      var props = {};
      var ident, values;

      next(';'); // start of Node

      whiteSpaces();

      while ( ch.match(/[a-zA-Z]/) ) { // start of PropIdent
        ident = propIdent();
        values = [];

        if ( props.hasOwnProperty(ident) ) {
          throw new SyntaxError( "Property '"+ident+"' already exists" );
        }

        while ( ch === '[' ) { // start of PropValue
          values.push( propValue() );
        }

        if ( !values.length ) {
          throw new SyntaxError( 'PropValue is missing: '+ident );
        }

        props[ident] = values;
      }

      return props;
    };

    var propIdent = function () {
      var ident = '';

      while ( ch.match(/[a-zA-Z\d]/) ) {
        ident += ch;
        next();
      }

      whiteSpaces();

      return ident;
    };

    var propValue = function () {
      var value = '';
      var prev;

      next('['); // start of PropValue

      while ( (prev === '\\' && ch === ']') || (ch && ch !== ']') ) {
        value += ch;
        prev = ch;
        next();
      }

      next(']'); // end of PropValue

      whiteSpaces();

      return value;
    };

    var whiteSpaces = function () {
      while ( ch && ch <= ' ' ) {
        next();
      }
    };

    var next = function (c) {
      if ( c && c !== ch ) {
        throw new SyntaxError( "'"+c+"' expected, got '"+ch+"'" );
      }
      at += 1;
      ch = text.charAt( at );
      return ch;
    };

    return function (text) {
      return collection(text);
    };
}());

var parseRegexp = (function () {
    var text, pos;

    var startOfGameTree = /^\s*\(\s*/g;
    var endOfGameTree = /^\)\s*/g;
    var startOfNode = /^;\s*/g;
    var property = /^([a-zA-Z\d]+)\s*((?:\[(?:\\]|[^\]])*\]\s*)+)/g;
    var propValue = /\[((?:\\]|[^\]])*)\]/g;

    var test = function (regexp) {
      regexp.lastIndex = 0;
      var bool = regexp.test(text.slice(pos));
      pos = bool ? pos+regexp.lastIndex : pos;
      return bool;
    };

    var exec = function (regexp) {
      regexp.lastIndex = 0;
      var splat = regexp.exec(text.slice(pos));
      pos = splat ? pos+regexp.lastIndex : pos;
      return splat;
    };

    var collection = function (t) {
      var trees = [];

      text = t;
      pos = 0;

      while ( test(startOfGameTree) ) {
        trees.push( gameTree() );
      }

      if ( pos !== text.length ) {
        test(/^\s*/);
        throw new SyntaxError( "Unexpected token '"+text.charAt(pos)+"'" );
      }

      return trees;
    };

    var gameTree = function () {
      var tree = [];
      var subtrees = [];

      while ( test(startOfNode) ) {
        tree.push( node() );
      }

      if ( !tree.length ) {
        throw new SyntaxError( 'GameTree must contain at least one Node' );
      }

      while ( test(startOfGameTree) ) {
        subtrees.push( gameTree() );
      }

      tree.push( subtrees );

      if ( !test(endOfGameTree) ) {
        test(/^\s*/);
        throw new SyntaxError( "Unexpected token '"+text.charAt(pos)+"'" );
      }

      return tree;
    };

    var node = function () {
      var props = {};
      var ident, value, values, vals;
      var prop;

      while ( prop = exec(property) ) {
        ident = prop[1];
        values = prop[2];
        vals = [];

        if ( props.hasOwnProperty(ident) ) {
          throw new SyntaxError( "Property '"+ident+"' already exists" );
        }

        while ( value = propValue.exec(values) ) {
          vals.push( value[1] );
        }

        if ( !values.length ) {
          throw new SyntaxError( 'PropValue is missing: '+ident );
        }

        props[ident] = vals;
      }

      return props;
    };

    return function (text) {
      return collection(text);
    };
}());

var files = [
  './benchmark/ff4_ex.sgf',
  './benchmark/kgs.sgf'
];

for ( var i = 0; i < files.length; i++ ) {
  var sgf = fs.readFileSync(files[i], { encoding: 'utf8' });
  var suite = new Benchmark.Suite;

  console.log('['+files[i]+']');

  assert.deepEqual( parse(sgf), parseRegexp(sgf) );

  suite.add('parse', function () {
    var collection = parse(sgf);
  }).
  add('parseRegexp', function () {
    var collection = parseRegexp(sgf);
  }).
  on('cycle', function (event) {
    console.log( String(event.target) );
  }).
  on('complete', function (event) {
    console.log( 'Fastest is '+this.filter('fastest').pluck('name') );
  }).
  run();
}

/*
  [./benchmark/ff4_ex.sgf]
  parse x 1,602 ops/sec ±4.93% (91 runs sampled)
  parseRegexp x 2,246 ops/sec ±0.65% (99 runs sampled)
  Fastest is parseRegexp

  [./benchmark/kgs.sgf]
  parse x 744 ops/sec ±0.31% (97 runs sampled)
  parseRegexp x 749 ops/sec ±0.32% (95 runs sampled)
  Fastest is parseRegexp
*/

