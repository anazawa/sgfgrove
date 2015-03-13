/**
 * @file Type-aware SGF parser/stringifier that supports FF[1], FF[3] and FF[4]
 * @author Ryo Anazawa
 * @version 0.0.1
 * @license MIT
 * @see http://www.red-bean.com/sgf/
 */
(function () {
  'use strict';

  var keys = Object.keys || function (object) {
    var keys = [];

    for ( var key in object ) {
      if ( object.hasOwnProperty(key) ) {
        keys.push( key );
      }
    }

    return keys;
  };

  function isNumber (value) {
    return typeof value === 'number' && isFinite(value);
  }

  function isString (value) {
    return typeof value === 'string';
  }

  var isArray = Array.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  var dump = function (v) { return JSON.stringify(v); };

  /**
   * @global
   * @namespace
   */
  var SGF = {};

  SGF.FF = (function () {
    var FF = {};

    FF.TYPES = {};

    FF.TYPES.scalar = function (args) {
      var spec = args || {};

      var like = spec.like || new RegExp('');
      var isa  = spec.isa  || function (v) { return isString(v) && like.test(v); };

      var parse     = spec.parse     || function (v) { return v; };
      var stringify = spec.stringify || function (v) { return String(v); };

      var that = {
        name: spec.name || ''
      };

      that.parse = function (values) {
        var value = values[0];

        if ( values.length > 1 || !like.test(value) ) {
          throw new TypeError( this.name+' expected, got '+dump(values) );
        }

        return parse(value);
      };

      that.stringify = function (value) {
        if ( !isa(value) ) { 
          throw new TypeError( this.name+' expected, got '+dump(value) );
        }
        return [ stringify(value) ];
      };

      return that;
    };

    return FF;
  }());

  /**
   * File Format (;FF[4])
   * @namespace
   * @memberof SGF
   * @see http://www.red-bean.com/sgf/sgf4.html
   * @see http://www.red-bean.com/sgf/properties.html
   */
  SGF.FF[4] = (function () {
    var FF = SGF.FF;
    var FF4 = {};

    FF4.TYPES = {};

    // Number = ["+"|"-"] Digit {Digit}
    FF4.TYPES.Number = FF.TYPES.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });

    // Color = ("B" | "W")
    FF4.TYPES.Color = FF.TYPES.scalar({
      name: 'Color',
      like: /^[BW]$/
    });

    // Triple = ("1" | "2")
    FF4.TYPES.Triple = FF.TYPES.scalar({
      name: 'Triple',
      like: /^[12]$/,
      isa: function (v) { return v === 1 || v === 2; },
      parse: function (v) { return parseInt(v, 10); }
    });

    FF4.TYPES.None = FF.TYPES.scalar({
      name: 'None',
      like: /^$/,
      isa: function (v) { return v === null; },
      parse: function (v) { return null; },
      stringify: function (v) { return ''; }
    });

    FF4.TYPES.Compose = function (left, right) {
      return left && right && {
        name: 'composed '+left.name+' ":" '+right.name,
        parse: function (values) {
          var value = values[0].match(/^((?:\\:|[^:])*):(.*)$/);

          if ( values.length > 1 || !value ) {
            throw new TypeError( this.name+' expected, got '+dump(values) );
          }

          return [
             left.parse( [value[1]] ),
            right.parse( [value[2]] )
          ];
        },
        stringify: function (value) {
          if ( !isArray(value) || value.length !== 2 ) {
            throw new TypeError( this.name+' expected, got '+dump(value) );
          }
          return [
            left.stringify(value[0])[0] +
            ':' +
            right.stringify(value[0])[0]
          ];
        }
      };
    };
 
    FF4.TYPES.listOf = function (type, args) {
      var canBeEmpty = args && args.canBeEmpty === true;

      return type && {
        name: (canBeEmpty ? 'elist of ' : 'list of ')+type.name,
        canBeEmpty: canBeEmpty,
        parse: function (values) {
          var vals = [];

          if ( values.length === 1 && values[0] === '' ) {
            if ( this.canBeEmpty ) {
              return vals;
            }
            throw new TypeError( this.name+' expected, got '+dump(values) );
          }

          for ( var i = 0; i < values.length; i++ ) {
            vals.push( type.parse([values[i]]) );
          }

          return vals;
        },
        stringify: function (values) {
          var vals = [];

          if ( !isArray(values) ) {
            throw new TypeError( 'array expected, got '+dump(values) );
          }

          if ( values.length ) {
            for ( var i = 0; i < values.length; i++ ) {
              vals.push( type.stringify(values[i])[0] );
            }
          }
          else if ( this.canBeEmpty ) {
            vals.push('');
          }
          else {
            throw new TypeError( this.name+' expected, got None' );
          } 

          return vals;
        }
      };
    };

    FF4.TYPES.elistOf = function (type) {
      return FF4.TYPES.listOf(type, { canBeEmpty: true });
    };

    FF4.TYPES.Unknown = {
      name: 'Unknown',
      parse: function (values) {
        var vals = [];

        for ( var i = 0; i < values.length; i++ ) {
          vals.push( values[i].replace(/\\\]/g, ']') );
        }

        return vals;
      },
      stringify: function (values) {
        var vals = [];

        if ( !isArray(values) ) {
          throw new TypeError( 'array expected, got '+dump(values) );
        }

        for ( var i = 0; i < values.length; i++ ) {
          if ( !isString(values[i]) ) {
            throw new TypeError( 'string expected, got '+dump(value) );
          }
          vals.push( values[i].replace(/\]/g, '\\]') );
        }

        return vals;
      }
    };

    // Real = Number ["." Digit { Digit }]
    FF4.TYPES.Real = FF.TYPES.scalar({
      name: 'Real',
      like: /^[+-]?\d+(?:\.\d+)?$/,
      isa: isNumber,
      parse: parseFloat
    });

    // Text = { any character }
    FF4.TYPES.Text = FF.TYPES.scalar({
      name: 'Text',
      parse: function (value) {
        return value.
          // remove soft linebreaks
          replace( /\\(?:\n\r?|\r\n?)/g, '' ).
          // convert white spaces other than linebreaks to space
          replace( /[^\S\n\r]/g, ' ' ).
          // insert escaped chars verbatim
          replace( /\\(.)/g, '$1' );
      },
      stringify: function (value) {
        return value.replace(/([\]\\:])/g, '\\$1'); // escape "]", "\" and ":"
      }
    });

    // SimpleText = { any character }
    FF4.TYPES.SimpleText = FF.TYPES.scalar({
      name: 'SimpleText',
      parse: function (value) {
        return value.
          // remove soft linebreaks
          replace( /\\(?:\n\r?|\r\n?)/g, '' ).
          // convert white spaces other than space to space even if it's escaped
          replace( /\\?[^\S ]/g, ' ' ).
          // insert escaped chars verbatim
          replace( /\\(.)/g, '$1' );
      },
      stringify: function (value) {
        return value.replace(/([\]\\:])/g, '\\$1'); // escape "]", "\" and ":"
      }
    });

    FF4.TYPES.BoardSize = function (square, rectangular) {
      return square && rectangular && {
        name: '('+square.name+' | '+rectangular.name+')',
        parse: function (values) {
          return (/:/.test(values[0]) ? rectangular : square).parse(values);
        },
        stringify: function (values) {
          return (isArray(values) ? rectangular : square).stringify(values);
        }
      };
    };

    FF4.TYPES.Figure = function (none, compose) {
      return none && compose && {
        name: '('+none.name+' | '+compose.name+')',
        parse: function (values) {
          return (/:/.test(values[0]) ? compose : none).parse(values);
        },
        stringify: function (values) {
          return (isArray(values) ? compose : none).stringify(values);
        }
      };
    };

    FF4.properties = function (types) {
      var t = types || FF4.TYPES;

      return {
        // Move properties
        B  : t.Move,
        KO : t.None,
        MN : t.Number,
        W  : t.Move,
        // Setup properties
        AB : t.listOfStone || t.listOf( t.Stone ),
        AE : t.listOfPoint || t.listOf( t.Point ),
        AW : t.listOfStone || t.listOf( t.Stone ),
        PL : t.Color,
        // Node annotation properties
        C  : t.Text,
        DM : t.Double,
        GB : t.Double,
        GW : t.Double,
        HO : t.Double,
        N  : t.SimpleText,
        UC : t.Double,
        V  : t.Real,
        // Move annotation properties
        BM : t.Double,
        DO : t.None,
        IT : t.None,
        TE : t.Double,
        // Markup properties
        AR : t.listOf( t.Compose(t.Point, t.Point) ),
        CR : t.listOfPoint || t.listOf( t.Point ),
        DD : t.elistOfPoint || t.elistOf( t.Point ),
        LB : t.listOf( t.Compose(t.Point, t.SimpleText) ),
        LN : t.listOf( t.Compose(t.Point, t.Point) ),
        MA : t.listOfPoint || t.listOf( t.Point ),
        SL : t.listOfPoint || t.listOf( t.Point ),
        SQ : t.listOfPoint || t.listOf( t.Point ),
        TR : t.listOfPoint || t.listOf( t.Point ),
        // Root properties
        AP : t.Compose( t.SimpleText, t.SimpleText ),
        CA : t.SimpleText,
        FF : t.Number,
        GM : t.Number,
        ST : t.Number,
        SZ : t.BoardSize( t.Number, t.Compose(t.Number, t.Number) ),
        // Game info properties
        AN : t.SimpleText,
        BR : t.SimpleText,
        BT : t.SimpleText,
        CP : t.SimpleText,
        DT : t.SimpleText,
        EV : t.SimpleText,
        GN : t.SimpleText,
        GC : t.Text,
        ON : t.SimpleText,
        OT : t.SimpleText,
        PB : t.SimpleText,
        PC : t.SimpleText,
        PW : t.SimpleText,
        RE : t.SimpleText,
        RO : t.SimpleText,
        RU : t.SimpleText,
        SO : t.SimpleText,
        TM : t.Real,
        US : t.SimpleText,
        WR : t.SimpleText,
        WT : t.SimpleText,
        // Timing properties
        BL : t.Real,
        OB : t.Number,
        OW : t.Number,
        WL : t.Real,
        // Miscellaneous properties
        FG : t.Figure( t.None, t.Compose(t.Number, t.SimpleText) ),
        PM : t.Number,
        VM : t.elistOfPoint || t.elistOf( t.Point ),
        // Unknown properties
        unknown : t.Unknown
      };
    };

    return FF4;
  }());

  /**
   * Go (;FF[4]GM[1]) specific properties
   * @namespace
   * @memberof SGF
   * @see http://www.red-bean.com/sgf/go.html
   */
  SGF.FF[4][1] = (function () {
    var FF = SGF.FF;
    var TYPES, PROPS;

    var expandPointList = (function () {
      var coord2char = 'abcdefghijklmnopqrstuvwxyz';
          coord2char = (coord2char + coord2char.toUpperCase()).split('');

      var char2coord = {};
      for ( var i = 0; i < coord2char.length; i++ ) {
        char2coord[coord2char[i]] = i;
      }

      return function (p1, p2) {
        var points = [];
        var x, y, h;

        var x1 = char2coord[ p1.charAt(0) ];
        var y1 = char2coord[ p1.charAt(1) ];
        var x2 = char2coord[ p2.charAt(0) ];
        var y2 = char2coord[ p2.charAt(1) ];

        if ( x1 > x2 ) {
          h = x1; x1 = x2; x2 = h;
        }

        if ( y1 > y2 ) {
          h = y1; y1 = y2; y2 = h;
        }

        for ( y = y1; y <= y2; y++ ) {
          for ( x = x1; x <= x2; x++ ) {
            points.push( coord2char[x]+coord2char[y] );
          }
        }

        return points;
      };
    }());

    TYPES = Object.create( FF[4].TYPES );

    TYPES.Point = FF.TYPES.scalar({
      name: 'Point',
      like: /^[a-zA-Z]{2}$/
    });
  
    TYPES.Stone = Object.create( TYPES.Point );
    TYPES.Stone.name = 'Stone';

    TYPES.Move = FF.TYPES.scalar({
      name: 'Move',
      like: /^(?:[a-zA-Z]{2})?$/,
      isa: function (v) {
        return v === null || (isString(v) && /^[a-zA-Z]{2}$/.test(v));
      },
      parse: function (v) { return v === '' ? null : v; },
      stringify: function (v) { return v === null ? '' : v; }
    });

    TYPES.listOfPoint = {
      name: 'list of Point',
      canBeEmpty: false,
      parse: function (values) {
        var vals = [];
        var i, points;

        if ( this.canBeEmpty && values.length === 1 && values[0] === '' ) {
          return vals;
        }

        for ( i = 0; i < values.length; i++ ) {
          points = values[i].match(/^([a-zA-Z]{2})(?::([a-zA-Z]{2}))?$/);

          if ( points && points[2] ) {
            vals = vals.concat( expandPointList(points[1], points[2]) );
          }
          else if ( points ) {
            vals.push( points[0] );
          }
          else {
            throw new TypeError( this.name+' expected, got '+dump(values[i]) );
          }
        }

        return vals;
      },
      stringify: function (values) {
        if ( !isArray(values) || (!this.canBeEmpty && values.length === 0) ) {
          throw new TypeError( this.name+' expected, got '+dump(values) );
        }
        for ( var i = 0; i < values.length; i++ ) {
          if ( !isString(values[i]) ||
               !/^[a-zA-Z]{2}(?::[a-zA-Z]{2})?$/.test(values[i]) ) {
            throw new TypeError( this.name+' expected, got '+dump(values[i]) );
          }
        }
        return values;
      }
    };

    TYPES.elistOfPoint = Object.create( TYPES.listOfPoint );
    TYPES.elistOfPoint.name = 'elist of Point';
    TYPES.elistOfPoint.canBeEmpty = true;

    TYPES.listOfStone = Object.create( TYPES.listOfPoint );
    TYPES.listOfStone.name = 'list of Stone';

    TYPES.elistOfStone = Object.create( TYPES.elistOfPoint );
    TYPES.elistOfStone.name = 'elist of Stone';
    
    PROPS = FF[4].properties( TYPES );

    PROPS.HA = TYPES.Number;
    PROPS.KM = TYPES.Real;
    PROPS.TB = TYPES.elistOfPoint;
    PROPS.TW = TYPES.elistOfPoint;

    return {
      TYPES: TYPES,
      PROPERTIES: PROPS
    };
  }());

  /**
   * Given a SGF string, returns an array representing a SGF collection.
   * You can also pass a callback function that is used to filter properties.
   * The callback is called with the object containing the property being
   * processed as `this` and with the name of the property and the value
   * as `arguments`. The return value is used to override the existing
   * property value. If the callback returns `undefined`, then the property
   * will be deleted.
   *
   * A SGF collection is represented by an array containing SGF
   * game trees. Each game tree is again an array of SGF nodes.
   * Each node is simply an object. Each SGF property is stored in the object
   * with the property name as the key, and the property value(s) for the value.
   * The last element of a game tree array always refers to an array
   * containing sub game trees, called variations.
   *
   * Collection:
   *
   *     [
   *       [GameTree],
   *       [GameTree],
   *       ...
   *       [GameTree]
   *     ]
   *
   * GameTree:
   *
   *     [
   *       {Node},
   *       {Node},
   *       ...
   *       {Node},
   *       [
   *         [GameTree],
   *         [GameTree],
   *         ...
   *         [GameTree]
   *       ]
   *     ]
   * 
   * Node:
   *
   *     {
   *       FF: 4,
   *       B: "pd"
   *     }
   *
   * You can also convert the above data structure to JSON:
   *
   *     JSON.stringify( SGF.parse('(;FF[4])') );
   *     // => JSON representaion of SGF
   *
   * While an invalid SGF is rejected, e.g., `(;FF[four])`, this method
   * does not care about the meaning of the given SGF property,
   * but the format of the property. In other words, it allows you to
   * parse a meaningless syntactically-correct SGF, such as
   * `(;FF[4]SZ[1]B[ZZ])`. You have to check the meanings by yourself.
   *
   * This method neither checks the CA (charset) property of the given
   * SGF string nor decodes the encoded properties, such as C (comment).
   * You have to decode them by yourself.
   *
   * This method does not convert HTML special characters in text properties
   * into their entity equivalents. You have to escape them by yourself.
   *
   * @function
   * @memberof SGF
   *
   * @param {String} text
   * @param {Function} [reviver]
   *
   * @returns {Array}
   *
   * @throws {Error}
   * @throws {SyntaxError}
   * @throws {TypeError}
   *
   * @example Basic Usage
   *
   * SGF.parse('(;FF[4]B[pd];W[qp])');
   * // => [[
   * //   { FF: 4, B: 'pd' },
   * //   { W: 'qp' },
   * //   []
   * // ]]
   *
   * @example Coordinate Transformation
   *
   * var char2coord = { 'a': 0, 'b': 1, ... };
   *
   * SGF.parse('(;FF[4]B[ab];W[ba])', function (key, value) {
   *  if ( key === 'B' || key === 'W' ) {
   *    var x = value.charAt(0);
   *    var y = value.charAt(1);
   *    return [ char2coord[x], char2coord[y] ];
   *  }
   *  else {
   *    return value;
   *  }
   * });
   * // => [[
   * //   { FF: 4, B: [0, 1] },
   * //   { W: [1, 0] },
   * //   []
   * // ]]
   *
   * @example Remove Comments
   *
   * SGF.parse('(;FF[4]C[foo: hi\nbar: gg])', function (key, value) {
   *  if ( key !== 'C' ) { // exclude the C property
   *    return value;
   *  }
   * });
   * // => [[
   * //   { FF: 4 },
   * //   []
   * // ]]
   *
   * @example GameTree Traversal
   *
   * var trees = SGF.parse('(;FF[4])'); // => [Collection]
   * var nodeId = 0;
   *
   * (function walk (subtrees) {
   *   subtrees;
   *   // => [
   *   //   [GameTree],
   *   //   [GameTree],
   *   //   ...
   *   //   [GameTree]
   *   // ]
   *
   *   for ( var i = 0; i < subtrees.length; i++ ) {
   *     var subtree = subtrees[i];
   *     // => [
   *     //   {Node},
   *     //   {Node},
   *     //   ...
   *     //   {Node},
   *     //   [[GameTree], [GameTree], ..., [GameTree]]
   *     // ]
   *
   *     if ( subtrees === trees ) {
   *       // 'subtree' is the direct descendant of Collection,
   *       // not trees within other trees
   *
   *       // one of root nodes
   *       subtree[0];
   *       // => {
   *       //   FF: 4
   *       // }
   *     }
   *
   *     // NOTE: exclude the last element of 'subtree'
   *     for ( var j = 0; j < subtree.length-1; j++ ) {
   *       var node = subtree[j];
   *
   *       node.id = nodeId; // assign node id
   *
   *       node; 
   *       // => {
   *       //   id: 0,
   *       //   FF: 4
   *       // }
   *
   *       nodeId += 1;
   *     }
   *
   *     // the last element of 'subtree' always refers to sub subtrees
   *     walk( subtree[subtree.length-1] );
   *   }
   * }(trees));
   *
   */
  SGF.parse = (function () {
    var FF = SGF.FF;
    var Num = FF[4].TYPES.Number;
    var source, lastIndex, reviver;

    var error = function (message) {
      var tail = source.slice(lastIndex).replace(/^\s*/, '').slice(0, 32);
      throw new SyntaxError( message+' at octet '+lastIndex+", '"+tail+"'" );
    };

    // Override RegExp's test and exec methods to let ^ behave like
    // the \G assertion (/\G.../gc). See also:
    // http://perldoc.perl.org/perlop.html#Regexp-Quote-Like-Operators
    
    var test = function (regexp) {
      regexp.lastIndex = 0;
      var bool = regexp.test( source.slice(lastIndex) );
      lastIndex = bool ? lastIndex+regexp.lastIndex : lastIndex;
      return bool;
    };

    var exec = function (regexp) {
      regexp.lastIndex = 0;
      var array = regexp.exec( source.slice(lastIndex) );
      lastIndex = array ? lastIndex+regexp.lastIndex : lastIndex;
      return array;
    };

    var gameTree = function () {
      var sequence = [];
      var subtrees = [], subtree;
      var node, ident, values, val;

      if ( !test(/^\s*\(\s*/g) ) { // start of GameTree
        return;
      }

      while ( test(/^;\s*/g) ) { // start of Node
        node = {};

        while ( ident = exec(/^([A-Z]+)\s*/g) ) { // PropIdent
          ident = ident[1];
          values = [];

          if ( node.hasOwnProperty(ident) ) {
            error( "Property '"+ident+"' already exists" );
          }

          while ( val = exec(/^\[((?:\\]|[^\]])*)\]\s*/g) ) { // PropValue
            values.push( val[1] );
          }

          if ( !values.length ) {
            error( 'PropValue of '+ident+' is missing' );
          }

          node[ident] = values;
        }

        sequence.push( node );
      }

      if ( !sequence.length ) {
        error( 'GameTree must contain at least one Node' );
      }

      while ( subtree = gameTree() ) {
        subtrees.push( subtree );
      }

      if ( !test(/^\)\s*/g) ) { // end of GameTree
        error( "Unexpected token '"+source.charAt(lastIndex)+"'" );
      }

      return [ sequence, subtrees ];
    };

    // Copied and rearranged from json2.js so that we can pass the same
    // callback to both of SGF.parse and JSON.parse
    // https://github.com/douglascrockford/JSON-js/blob/master/json2.js
    var walk = function (holder, key) {
      var k, v, value = holder[key];
      if ( value && typeof value === 'object' ) {
        for ( k in value ) {
          if ( Object.prototype.hasOwnProperty.call(value, k) ) {
            v = walk( value, k );
            if ( v !== undefined ) {
              value[k] = v;
            } else {
              delete value[k];
            }
          }
        }
      }
      return reviver.call(holder, key, value);
    };

    return function (text, rev) {
      var trees = [], tree;
      var PROPS, nodeId = 0;

      source = String(text);
      lastIndex = 0;
      reviver = typeof rev === 'function' && rev;

      while ( tree = gameTree() ) {
        trees.push( tree );
      }

      if ( lastIndex !== source.length ) {
        error( "Unexpected token '"+source.charAt(lastIndex)+"'" );
      }

      (function finalize (subtrees) {
        var i, subtree, sequence, root, ff, gm;
        var j, node, id, PROP;

        for ( i = 0; i < subtrees.length; i++ ) {
          subtree = subtrees[i];
          sequence = subtree[0];

          if ( subtrees === trees ) {
            try {
              root = sequence[0];
              ff = root.hasOwnProperty('FF') ? Num.parse(root.FF) : 1;
              gm = root.hasOwnProperty('GM') ? Num.parse(root.GM) : 1;

              if ( ff < 1 || gm < 1 || !FF.hasOwnProperty(ff) ) {
                throw new Error( 'FF['+ff+']GM['+gm+'] is not supported' );
              }

              PROPS = FF[ff].hasOwnProperty(gm) && FF[ff][gm].PROPERTIES;
              PROPS = PROPS || FF[ff].properties();
            }
            catch (error) {
              error.message += ' at node #'+nodeId+', '+dump(root);
              throw error;
            }
          }

          for ( j = 0; j < sequence.length; j++ ) {
            node = sequence[j];

            for ( id in node ) {
              try {
                if ( !node.hasOwnProperty(id) ) { continue; }
                PROP = PROPS.hasOwnProperty(id) ? PROPS[id] : PROPS.unknown;
                node[id] = PROP.parse( node[id] );
              }
              catch (error) {
                error.message += ' at '+id+' of node #'+nodeId+', '+dump(node);
                throw error;
              }
            }

            nodeId += 1;
          }

          finalize( subtree[1] );
        }
      }(trees));

      return reviver ? walk({ '': trees }, '') : trees;
    };
  }());

  /**
   * Given an array representing a SGF collection, returns a SGF string.
   * If a property name does not look like SGF, the property will be ignored
   * silently. In other words, that property is considered user-defined.
   * For example, "FOO" and "FOOBAR" are valid FF[4] property names.
   * "foo", "fooBar" and "foo_bar" are ignored. If a property value has
   * toSGF method, the value is replaced with the return value of the method.
   *
   * @function
   * @memberof SGF
   *
   * @param {Array} trees
   * @param {Array|function} [replacer]
   *
   * @returns {String}
   *
   * @throws {Error}
   * @throws {TypeError}
   *
   * @example
   *
   * SGF.stringify([[{ FF: 4 }, []]]); // => "(;FF[4])"
   *
   * @example User-defined properties are ignored
   *
   * SGF.stringify([[
   *   {
   *     FF: 4,
   *     foo: 'bar' // ignored
   *   },
   *   []
   * ]]);
   * // => "(;FF[4])"
   *
   * @example Using toSGF Method
   *
   * SGF.stringify([[
   *   {
   *     FF: 4,
   *     FOO: {
   *       bar: 'baz',
   *       toSGF: function () {
   *         return [ this.bar ];
   *       }
   *     }
   *   },
   *   []
   * ]]);
   * // => "(;FF[4]FOO[baz])"
   *
   */
  SGF.stringify = (function () {
    var FF = SGF.FF;
    var Num = FF[4].TYPES.Number;
    var replacer, select;

    var replace = function (key, holder) {
      var value = holder[key];

      if ( value && typeof value === 'object' &&
           typeof value.toSGF === 'function' ) {
        value = value.toSGF();
      }

      return replacer ? replacer.call(holder, key, value) : value;
    };

    var finalize = function (key, holder) {
      var trees = replace( key, holder );
      var copy = [];
      var i, tree, sequence, s;
      var j, node, n, ident, values;

      if ( !isArray(trees) ) {
        throw new TypeError( 'array expected, got '+trees );
      }

      for ( i = 0; i < trees.length; i++ ) {
        tree = replace( i, trees );

        if ( !isArray(tree) ) {
          throw new TypeError( 'array expected, got '+dump(tree) );
        }

        sequence = replace( 0, tree );
        s = [];

        if ( !isArray(sequence) ) {
          throw new TypeError( 'array expected, got '+dump(sequence) );
        }
        else if ( !sequence.length ) {
          throw new TypeError( 'GameTree must contain at least one Node' );
        }

        for ( j = 0; j < sequence.length; j++ ) {
          node = replace( j, sequence );
          n = {};

          if ( !node || typeof node !== 'object' ) {
            throw new TypeError( 'object expected, got '+node );
          }

          for ( ident in node ) {
            if ( !node.hasOwnProperty(ident) ) { continue; }
            if ( select && !select.hasOwnProperty(ident) ) { continue; }
            if ( /[^A-Z]/.test(ident) ) { continue; }

            values = replace( ident, node );

            if ( values !== undefined ) {
              n[ident] = values;
            }
          }

          s.push(n);
        }

        copy.push([ s, finalize(1, tree) ]);
      }

      return copy;
    };

    var stringify = function (trees, collection, PROPS) {
      var text = '';
      var i, tree, sequence, root, ff, gm;
      var j, node, ident, values;

      collection = collection || trees;

      for ( i = 0; i < trees.length; i++ ) {
        tree = trees[i];
        sequence = tree[0];

        if ( trees === collection ) {
          root = sequence[0];

          ff = root.hasOwnProperty('FF') ? root.FF : 1;
          ff = Num.parse( Num.stringify(ff) );

          gm = root.hasOwnProperty('GM') ? root.GM : 1;
          gm = Num.parse( Num.stringify(gm) );

          if ( ff < 1 || gm < 1 || !FF.hasOwnProperty(ff) ) {
            throw new Error( 'FF['+ff+']GM['+gm+'] is not supported' );
          }

          PROPS = FF[ff].hasOwnProperty(gm) && FF[ff][gm].PROPERTIES;
          PROPS = PROPS || FF[ff].properties();
        }
 
        text += '('; // Open GameTree

        for ( j = 0; j < sequence.length; j++ ) {
          node = sequence[j];

          text += ';'; // Open Node

          for ( ident in node ) {
            if ( !node.hasOwnProperty(ident) ) { continue; }
            values = (PROPS[ident] || PROPS.unknown).stringify(node[ident]);
            text += ident + '[' + values.join('][') + ']'; // add Property
          }
        }

        text += stringify( tree[1], collection, PROPS );
        text += ')'; // close GameTree
      }

      return text;
    };

    return function (trees, rep, space) {
      var nodeId = 0;
      var gap = '';
      var indent = '';
      var i, PROPS;

      select = undefined;
      replacer = undefined;

      if ( rep && typeof rep === 'object' &&
           typeof rep.length === 'number' ) {
        select = {};
        for ( i = 0; i < rep.length; i++ ) {
          if ( typeof rep[i] === 'string' ) {
            select[rep[i]] = null;
          }
        }
      }
      else if ( typeof rep === 'function' ) {
        replacer = rep;
      }
      else if ( rep ) {
        throw new Error('replacer must be array or function');
      }

      if ( typeof space === 'number' ) {
        for ( i = 0; i < space; i++ ) {
          indent += ' ';
        }
      }
      else if ( typeof space === 'string' ) {
        indent = space;
      }

      trees = finalize( '', { '': trees } );

      return (function stringify (subtrees) {
        var text = '', mind, partial, prefix;
        var i, subtree, sequence, root, ff, gm;
        var j, node, id, values, PROP;

        for ( i = 0; i < subtrees.length; i++ ) {
          subtree = subtrees[i];
          sequence = subtree[0];

          if ( subtrees === trees ) {
            try {
              root = sequence[0];

              ff = root.hasOwnProperty('FF') ? root.FF : 1;
              ff = Num.parse( Num.stringify(ff) );

              gm = root.hasOwnProperty('GM') ? root.GM : 1;
              gm = Num.parse( Num.stringify(gm) );

              if ( ff < 1 || gm < 1 || !FF.hasOwnProperty(ff) ) {
                throw new Error( 'FF['+ff+']GM['+gm+'] is not supported' );
              }

              PROPS = FF[ff].hasOwnProperty(gm) && FF[ff][gm].PROPERTIES;
              PROPS = PROPS || FF[ff].properties();
            }
            catch (error) {
              error.message += ' at node #'+nodeId+', '+dump(root);
              throw error;
            }
          }
 
          text += indent ? gap+'(\n' : '('; // Open GameTree

          mind = gap;
          gap += indent;

          for ( j = 0; j < sequence.length; j++ ) {
            node = sequence[j];

            text += indent ? '' : ';'; // Open Node
            prefix = ';';

            for ( id in node ) {
              try {
                if ( !node.hasOwnProperty(id) ) { continue; }
                PROP = PROPS.hasOwnProperty(id) ? PROPS[id] : PROPS.unknown;
                partial = id + '[' + PROP.stringify(node[id]).join('][') + ']';
                text += indent ? gap+prefix+partial+'\n' : partial; // add Prop
                prefix = ' ';
              }
              catch (error) {
                error.message += ' at '+id+' of node #'+nodeId+', '+dump(node);
                throw error;
              }
            }

            nodeId += 1;
          }

          text += stringify( subtree[1] );
          text += indent ? mind+')\n' : ')'; // close GameTree

          gap = mind;
        }

        return text;
      }(trees));
    };
  }());

  if ( typeof exports !== 'undefined' ) {
    module.exports = SGF;
  }
  else {
    window.SGFGROVE = SGF;
  }

}());

