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
   * Original File Format
   * @namespace
   * @memberof SGF
   * @see http://www.red-bean.com/sgf/ff1_3/ff1.html
   */
  SGF.FF[1] = (function () {
    var FF = SGF.FF;
    var FF1 = {};

    FF1.TYPES = {};

    // Number = ["+"|"-"] Digit {Digit}
    FF1.TYPES.Number = FF.TYPES.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });

    // Color = ("B" | "W")
    FF1.TYPES.Color = FF.TYPES.scalar({
      name: 'Color',
      like: /^[BW]$/
    });

    // Triple = ("1" | "2")
    FF1.TYPES.Triple = FF.TYPES.scalar({
      name: 'Triple',
      like: /^[12]$/,
      isa: function (v) { return v === 1 || v === 2; },
      parse: function (v) { return parseInt(v, 10); }
    });

    // Real = Number ["." {Digit}]
    FF1.TYPES.Real = FF.TYPES.scalar({
      name: 'Real',
      like: /^[+-]?\d+(?:\.\d*)?$/,
      isa: isNumber,
      parse: parseFloat
    });

    // Text = { any charcter; "\]" = "]", "\\" = "\"}
    FF1.TYPES.Text = FF.TYPES.scalar({
      name: 'Text',
      parse: function (v) { return v.replace(/\\([\]\\])/g, '$1'); },
      stringify: function (v) { return v.replace(/([\]\\])/g, '\\$1'); }
    });

    // for FG, while None is introduced in FF[4]
    FF1.TYPES.None = FF.TYPES.scalar({
      name: 'None',
      like: /^$/,
      isa: function (v) { return v === null; },
      parse: function (v) { return null; },
      stringify: function (v) { return ''; }
    });

    // for "point list", while "list of" is introduced in FF[4]
    FF1.TYPES.listOf = function (type, args) {
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

    // for VW, while "elist of" is introduced in FF[4]
    FF1.TYPES.elistOf = function (type) {
      return FF1.TYPES.listOf(type, { canBeEmpty: true });
    };

    FF1.TYPES.Unknown = {
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

    FF1.properties = function (types) {
      var t = types || FF1.TYPES;

      return {
        B  : t.Move,
        W  : t.Move,
        C  : t.Text,
        N  : t.Text,
        //
        V  : t.Number,
        //
        CH : t.Triple,
        GB : t.Triple,
        GW : t.Triple,
        TE : t.Triple,
        BM : t.Triple,
        // times
        BL : t.Real,
        WL : t.Real,
        // figure
        FG : t.None,
        // set up
        AB : t.listOf( t.Point ),
        AW : t.listOf( t.Point ),
        AE : t.listOf( t.Point ),
        PL : t.Color,
        // game info
        GN : t.Text, 
        GC : t.Text,
        EV : t.Text,
        RO : t.Text,
        DT : t.Text,
        PC : t.Text,
        PB : t.Text,
        PW : t.Text,
        RE : t.Text,
        US : t.Text,
        TM : t.Text,
        SO : t.Text,
        // root
        GM : t.Number,
        SZ : t.Number,
        VW : t.elistOf( t.Point ), // "an empty list denotes the whole board"
        BS : t.Number,
        WS : t.Number,
        // computer algorithms
        EL : t.Number,
        EX : t.Move,
        // marking
        SL : t.listOf( t.Point ),
        M  : t.listOf( t.Point ),
        L  : t.listOf( t.Point ),
        // unknown
        unknown : t.Unknown
      };
    };

    return FF1;
  }());

  /**
   * Go (;GM[1]) specific properties
   * @namespace
   * @memberof SGF
   */
  SGF.FF[1][1] = (function () {
    var FF = SGF.FF;
    var TYPES, PROPS;

    TYPES = Object.create( FF[1].TYPES );

    TYPES.Point = FF.TYPES.scalar({
      name: 'Point',
      like: /^[a-s]{2}$/
    });

    TYPES.Move = FF.TYPES.scalar({
      name: 'Move',
      like: /^(?:[a-s]{2}|tt)$/
    });

    PROPS = FF[1].properties( TYPES );

    PROPS.BR = TYPES.Text;
    PROPS.WR = TYPES.Text;
    PROPS.HA = TYPES.Number;
    PROPS.KM = TYPES.Real;
    PROPS.TB = TYPES.listOf( TYPES.Point );
    PROPS.TW = TYPES.listOf( TYPES.Point );
    PROPS.SC = TYPES.listOf( TYPES.Point );
    PROPS.RG = TYPES.listOf( TYPES.Point );

    return {
      TYPES: TYPES,
      PROPERTIES: PROPS
    };
  }());

  // "FF[2] was never made public. It's more or less identical to FF[1] -
  // the only changes known (to me) are that the BS/WS values had been
  // redefined." (http://www.red-bean.com/sgf/proplist_ff.html)
  SGF.FF[2] = SGF.FF[1];

  /**
   * File Format (;FF[3])
   * @namespace
   * @memberof SGF
   * @see http://www.red-bean.com/sgf/ff1_3/ff3.html
   * @see http://www.red-bean.com/sgf/ff1_3/sgfhistory.html
   */
  SGF.FF[3] = (function () {
    var FF = SGF.FF;
    var FF3 = {};

    FF3.TYPES = Object.create( FF[1].TYPES );

    FF3.TYPES.Compose = function (left, right) {
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

    FF3.properties = function (types) {
      var t = types || FF3.TYPES;

      return {
        // Moves
        B  : t.Move,
        W  : t.Move,
        // Setup Position or Problem
        AB : t.listOf( t.Point ),
        AW : t.listOf( t.Point ),
        AE : t.listOf( t.Point ),
        PL : t.Color,
        // Node Annotation
        C  : t.Text,
        N  : t.Text,
        SE : t.listOf( t.Point ),
        // Move Annotation
        V  : t.Real,
        CH : t.Triple,
        GB : t.Triple,
        GW : t.Triple,
        TE : t.Triple,
        BM : t.Triple,
        DO : t.None,
        IT : t.None,
        UC : t.Triple,
        DM : t.Triple,
        HO : t.Triple,
        SI : t.Triple,
        // Time Control
        BL : t.Real,
        WL : t.Real,
        OB : t.Number,
        OM : t.Number,
        OP : t.Real,
        OV : t.Number,
        OW : t.Number,
        // Diagrams and Printing
        FG : t.None,
        MN : t.Number,
        // Root Properties
        FF : t.Number,
        GM : t.Number,
        SZ : t.Number,
        BS : t.Number,
        WS : t.Number,
        LT : t.None,
        // Game Info
        GN : t.Text,
        GC : t.Text,
        EV : t.Text,
        RO : t.Text,
        DT : t.Text,
        PC : t.Text,
        PB : t.Text,
        PW : t.Text,
        BT : t.Text,
        WT : t.Text,
        RE : t.Text,
        US : t.Text,
        TM : t.Text,
        SO : t.Text,
        AN : t.Text,
        CP : t.Text,
        ID : t.Text,
        ON : t.Text,
        // Position Annotation
        SL : t.listOf( t.Point ),
        MA : t.listOf( t.Point ),
        TR : t.listOf( t.Point ),
        CR : t.listOf( t.Point ),
        LB : t.Compose( t.Point, t.Text ),
        // Unknown
        unknown : t.Unknown
      };
    };

    return FF3;
  }());

  /**
   * Go (;FF[3]GM[1]) specific properties
   * @namespace
   * @memberof SGF
   */
  SGF.FF[3][1] = (function () {
    var FF = SGF.FF;
    var TYPES, PROPS;

    TYPES = Object.create( FF[3].TYPES );

    TYPES.Point = FF[1][1].TYPES.Point;
    TYPES.Move  = FF[1][1].TYPES.Move;

    PROPS = FF[3].properties( TYPES );

    PROPS.KO = TYPES.None;
    PROPS.RU = TYPES.Text;
    PROPS.BR = TYPES.Text;
    PROPS.WR = TYPES.Text;
    PROPS.HA = TYPES.Number;
    PROPS.KM = TYPES.Real;
    PROPS.TB = TYPES.listOf( TYPES.Point );
    PROPS.TW = TYPES.listOf( TYPES.Point );
    PROPS.TC = TYPES.Number;
    PROPS.SC = TYPES.listOf( TYPES.Point );
    PROPS.RG = TYPES.listOf( TYPES.Point );

    return {
      TYPES: TYPES,
      PROPERTIES: PROPS
    };
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

    FF4.TYPES = Object.create( FF[3].TYPES );

    FF4.TYPES.Double = Object.create( FF4.TYPES.Triple );
    FF4.TYPES.Double.name = 'Double';

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
    var Num = FF[1].TYPES.Number;
    var source, lastIndex;

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
      var splat = regexp.exec( source.slice(lastIndex) );
      lastIndex = splat ? lastIndex+regexp.lastIndex : lastIndex;
      return splat;
    };

    var gameTree = function () {
      var sequence = [];
      var variations = [], variation;
      var node, ident, values, val;

      if ( !test(/^\s*\(\s*/g) ) { // start of GameTree
        return;
      }

      while ( test(/^;\s*/g) ) { // start of Node
        node = {};

        while ( ident = exec(/^([a-zA-Z\d]+)\s*/g) ) { // PropIdent(-like)
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

      while ( variation = gameTree() ) {
        variations.push( variation );
      }

      if ( !test(/^\)\s*/g) ) { // end of GameTree
        error( "Unexpected token '"+source.charAt(lastIndex)+"'" );
      }

      return [
        sequence,
        variations
      ];
    };

    var finalize = function (trees, collection, ff, PROPS, nodeId) {
      var i, tree, root, gm;
      var j, node, idents;
      var k, ident, id, values;

      collection = collection || trees;
      nodeId = nodeId || 0;

      for ( i = 0; i < trees.length; i++ ) {
        tree = trees[i];

        if ( trees === collection ) {
          root = tree[0][0];

          try {
            ff = root.FF ? Num.parse(root.FF) : 1;
            gm = root.GM ? Num.parse(root.GM) : 1;

            if ( ff !== 4 && ff !== 3 && ff !== 1 ) {
              throw new Error( 'FF['+ff+'] is not supported' );
            }
          }
          catch (error) {
            error.message += ' at node #'+nodeId+', '+dump(root);
            throw error;
          }

          PROPS = FF[ff][gm] ? FF[ff][gm].PROPERTIES : FF[ff].properties();
        }

        for ( j = 0; j < tree[0].length; j++ ) {
          node = tree[0][j];
          idents = keys(node); // to rename

          for ( k = 0; k < idents.length; k++ ) {
            try {
              ident = idents[k];
              values = node[ident];

              if ( ff === 1 && !/^[A-Z][A-Z\d]?$/.test(ident) ) {
                throw new SyntaxError( 'Not a FF[1] PropIdent' );
              }

              if ( ff === 3 ) {
                id = ident.replace(/[a-z]/g, '');

                if ( !/^[A-Z][A-Z\d]?$/.test(id) ) {
                  throw new SyntaxError( 'Not a FF[3] PropIdent' );
                }

                if ( id !== ident && node.hasOwnProperty(id) ) {
                  throw new SyntaxError( "Property '"+id+"' already exists" );
                }

                if ( id !== ident ) {
                  delete node[ident];
                  ident = id;
                }
              }

              if ( ff === 4 && !/^[A-Z]+$/.test(ident) ) {
                throw new SyntaxError( 'Not a FF[4] PropIdent' );
              }

              node[ident] = (PROPS[ident] || PROPS.unknown).parse(values);
            }
            catch (error) {
              error.message += ' at '+ident+' of node #'+nodeId+', '+dump(node);
              throw error;
            }
          }

          nodeId += 1;
        }

        finalize( tree[1], collection, ff, PROPS, nodeId );
      }
    };

    // Copied and rearranged from json2.js:
    // https://github.com/douglascrockford/JSON-js/blob/master/json2.js
    var walk = function (holder, key, reviver) {
      var k, v, value = holder[key];
      if ( value && typeof value === 'object' ) {
        for ( k in value ) {
          if ( Object.prototype.hasOwnProperty.call(value, k) ) {
            v = walk( value, k, reviver );
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

    return function (text, reviver) {
      var trees = [], tree;

      source = String(text);
      lastIndex = 0;

      while ( tree = gameTree() ) {
        trees.push( tree );
      }

      if ( lastIndex !== source.length ) {
        error( "Unexpected token '"+source.charAt(lastIndex)+"'" );
      }

      finalize( trees );

      if ( typeof reviver === 'function' ) {
        return walk({ '': trees }, '', reviver);
      }

      return trees;
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
    var Num = FF[1].TYPES.Number;

    var toSGF = function (value) {
      if ( value && typeof value === 'object' &&
           typeof value.toSGF === 'function' ) {
        value = value.toSGF();
      }
      return value;
    };

    var stringify = function (trees, replacer, select, collection, ff, PROPS) {
      var text = '';
      var i, tree, subtrees;
      var j, node, root, gm;
      var ident, values;

      if ( !isArray(trees) ) {
        throw new TypeError( 'Array expected, got '+trees );
      }

      collection = collection || trees;

      for ( i = 0; i < trees.length; i++ ) {
        tree = toSGF( trees[i] );
        tree = replacer ? replacer.call(trees, i, tree) : tree;

        if ( !isArray(tree) ) {
          throw new TypeError( 'Array expected, got '+tree );
        }

        if ( tree[0].length === 0 ) {
          throw new TypeError( 'GameTree must contain at least one Node' );
        }

        root = trees === collection && {};

        text += '('; // open GameTree

        for ( j = 0; j < tree[0].length; j++ ) {
          node = toSGF( tree[0][j] );
          node = replacer ? replacer.call(tree[0], j, node) : node;

          if ( !node || typeof node !== 'object' ) {
            throw new TypeError( 'Object expected, got '+node );
          }

          text += ';'; // open Node

          for ( ident in node ) {
            if ( !node.hasOwnProperty(ident) ) { continue; }
            if ( select && !select.hasOwnProperty(ident) ) { continue; }

            // ignore non-SGF properties
            if ( ff === 1 && !/^[A-Z][A-Z\d]?$/.test(ident) ) { continue; }
            if ( ff === 3 && !/^[A-Z][A-Z\d]?$/.test(ident) ) { continue; }
            if ( ff === 4 && !/^[A-Z]+$/.test(ident) ) { continue; }

            values = toSGF( node[ident] );
            values = replacer ? replacer.call(node, ident, values) : values;

            if ( values === undefined ) { continue; }

            if ( root ) {
              root[ident] = values;
              continue; // we don't know how to stringify 'values' yet
            }

            values = (PROPS[ident] || PROPS.unknown).stringify(values);

            text += ident + '[' + values.join('][') + ']'; // add Property
          }

          if ( !root ) { continue; }

          ff = root.hasOwnProperty('FF') ? root.FF : 1;
          ff = Num.parse( Num.stringify(ff) );

          gm = root.hasOwnProperty('GM') ? root.GM : 1;
          gm = Num.parse( Num.stringify(gm) );

          if ( ff !== 4 && ff !== 3 && ff !== 1 ) {
            throw new Error( 'FF['+ff+'] is not supported' );
          }

          PROPS = FF[ff][gm] ? FF[ff][gm].PROPERTIES : FF[ff].properties();

          for ( ident in root ) {
            if ( !root.hasOwnProperty(ident) ) { continue; }
            values = (PROPS[ident] || PROPS.unknown).stringify(root[ident]);
            text += ident + '[' + values.join('][') + ']'; // add Property
          }

          root = undefined;
        }

        subtrees = toSGF( tree[1] );
        subtrees = replacer ? replacer.call(tree, tree.length-1, subtrees) : subtrees;

        text += stringify( subtrees, replacer, select, collection, ff, PROPS );
        text += ')'; // close GameTree
      }

      return text;
    };

    return function (trees, replacer) {
      var select, i;

      if ( replacer && typeof replacer === 'object' &&
           typeof replacer.length === 'number' ) {
        select = {};
        for ( i = 0; i < replacer.length; i++ ) {
          if ( typeof replacer[i] !== 'string' ) { continue; }
          select[replacer[i]] = true;
        }
        replacer = undefined;
      }
      else if ( replacer && typeof replacer !== 'function') {
        throw new Error('replacer must be array or function');
      }

      trees = toSGF( trees );
      trees = replacer ? replacer.call({ '': trees }, '', trees) : trees;

      return stringify( trees, replacer, select );
    };
  }());

  if ( typeof exports !== 'undefined' ) {
    module.exports = SGF;
  }
  else {
    window.SGF = SGF;
  }

}());

