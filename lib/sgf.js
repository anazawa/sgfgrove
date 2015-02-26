(function (window) {
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

  function foreach (array, cb) {
    var length = array.length;
    for ( var i = 0; i < length; i++ ) {
      cb( array[i], i );
    }
  }

  function isNumber (value) {
    return typeof value === 'number' && isFinite(value);
  }

  function isString (value) {
    return typeof value === 'string';
  }

  var isArray = Array.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  var quote = function (a) { return "'"+a.join("', '")+"'"; };

  var SGF = {};

  SGF.FF = (function () {
    var FF = {};

    FF.TYPES = {};

    FF.TYPES.scalar = function (args) {
      var spec = args || {};

      var like = spec.like || new RegExp();
      var isa  = spec.isa  || function (v) { return isString(v) && v.match(like); };

      var parse     = spec.parse     || function (v) { return v; };
      var stringify = spec.stringify || function (v) { return '' + v; };

      var that = {
        name: spec.name || ''
      };

      that.parse = function (values) {
        var value = values[0];

        if ( values.length > 1 || !value.match(like) ) {
          throw new TypeError( this.name+' expected, got '+quote(values) );
        }

        return parse(value);
      };

      that.stringify = function (value) {
        if ( !isa(value) ) { 
          throw new TypeError( this.name+" expected, got '"+value+"'" );
        }

        return [ stringify(value) ];
      };

      return that;
    };

    FF.TYPES.Number = FF.TYPES.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });

    return FF;
  }());

  /*
   * Original File Format
   * http://www.red-bean.com/sgf/ff1_3/ff1.html
   */

  SGF.FF[1] = (function () {
    var FF = SGF.FF;
    var FF1 = {};

    FF1.TYPES = {
      Number : FF.TYPES.Number
    };

    FF1.TYPES.Color = FF.TYPES.scalar({
      name: 'Color',
      like: /^[BW]$/
    });

    FF1.TYPES.Triple = FF.TYPES.scalar({
      name: 'Triple',
      like: /^[12]$/,
      isa: function (v) { return v === 1 || v === 2; },
      parse: function (v) { return parseInt(v, 10); }
    });

    FF1.TYPES.Real = FF.TYPES.scalar({
      name: 'Real',
      like: /^[+-]?\d+(?:\.\d*)?$/,
      isa: isNumber,
      parse: parseFloat
    });

    FF1.TYPES.Text = FF.TYPES.scalar({
      name: 'Text',
      parse: function (v) { return v.replace(/\\([\]\\])/g, '$1'); },
      stringify: function (v) { return v.replace(/([\]\\])/g, '\\$1'); }
    });

    FF1.TYPES.None = FF.TYPES.scalar({
      name: 'None',
      like: /^$/
    });

    FF1.TYPES.listOf = function (type) {
      return type && {
        name: 'list of '+type.name,
        parse: function (values) {
          var vals = [];

          if ( values.length === 1 && values[0] === '' ) {
            throw new TypeError( this.name+' expected, got None' );
          }

          foreach(values, function (value) {
            vals.push( type.parse([value]) );
          });

          return vals;
        },
        stringify: function (values) {
          var vals = [];

          if ( !isArray(values) ) {
            throw new TypeError( 'Array expected, got'+values );
          }

          if ( !values.length ) {
            throw new TypeError( this.name+' expected, got None' );
          }

          foreach(values, function (value) {
            vals.push( type.stringify(value)[0] );
          });

          return vals;
        }
      };
    };

    FF1.TYPES.Unknown = {
      name: 'Unknown',
      parse: function (values) {
        var vals = [];

        foreach(values, function (value) {
          vals.push( value.replace(/\\\]/g, ']') );
        });

        return vals;
      },
      stringify: function (values) {
        var vals = [];

        if ( !isArray(values) ) {
          throw new TypeError( 'Array expected, got '+values );
        }

        foreach(values, function (value) {
          if ( isString(value) ) {
            vals.push( value.replace(/\]/g, '\\]') );
          }
          else {
            throw new TypeError( 'String expected, got '+value );
          }
        });

        return vals;
      }
    };

    FF1.properties = function (types) {
      var t = types || FF[1].TYPES;

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
        VW : t.listOf( t.Point ),
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

  /*
   * Go (;GM[1]) specific properties
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
      like: /^[a-t]{2}$/
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

  /*
   * File Format (;FF[3])
   * http://www.red-bean.com/sgf/ff1_3/ff3.html
   * http://www.red-bean.com/sgf/ff1_3/sgfhistory.html
   */

  SGF.FF[3] = (function () {
    var FF = SGF.FF;
    var FF3 = {};

    FF3.TYPES = Object.create( FF[1].TYPES );

    FF3.TYPES.Compose = function (left, right) {
      return left && right && {
        name: 'composed ' + left.name + ' ":" ' + right.name,
        parse: function (values) {
          var value = values[0].match(/^((?:[^\\:]+|\\.)*):(.*)$/);

          if ( values.length > 1 || !value ) {
            throw new TypeError( this.name+' expected, got '+quote(values) );
          }

          return [
             left.parse( [value[1]] ),
            right.parse( [value[2]] )
          ];
        },
        stringify: function (value) {
          if ( !isArray(value) || value.length !== 2 ) {
            throw new TypeError( this.name+' expected, got '+value );
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
        KO : t.None,
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

  /*
   * Go (;FF[3]GM[1]) specific properties
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

  /*
   * File Format (;FF[4])
   * http://www.red-bean.com/sgf/sgf4.html
   * http://www.red-bean.com/sgf/properties.html
   */

  SGF.FF[4] = (function () {
    var FF = SGF.FF;
    var FF4 = {};

    FF4.TYPES = {
      Number  : FF[3].TYPES.Number,
      Color   : FF[3].TYPES.Color,
      None    : FF[3].TYPES.None,
      Compose : FF[3].TYPES.Compose,
      Unknown : FF[3].TYPES.Unknown,
      listOf  : FF[3].TYPES.listOf
    };

    FF4.TYPES.Double = Object.create( FF[3].TYPES.Triple );
    FF4.TYPES.Double.name = 'Double';

    FF4.TYPES.Real = FF.TYPES.scalar({
      name: 'Real',
      like: /^[+-]?\d+(?:\.\d+)?$/,
      isa: isNumber,
      parse: parseFloat
    });

    FF4.TYPES.SimpleText = FF.TYPES.scalar({
      name: 'SimpleText',
      isa: isString,
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

    FF4.TYPES.BoardSize = function (square, rectangular) {
      return square && rectangular && {
        name: square.name + ' or ' + rectangular.name,
        parse: function (values) {
          return (values[0].match(/:/) ? rectangular : square).parse(values);
        },
        stringify: function (values) {
          return (isArray(values) ? rectangular : square).stringify(values);
        }
      };
    };

    FF4.TYPES.Figure = function (none, compose) {
      return none && compose && {
        name: none.name + ' or ' + compose.name,
        parse: function (values) {
          return (values[0].match(/:/) ? compose : none).parse(values);
        },
        stringify: function (values) {
          return (isArray(values) ? compose : none).stringify(values);
        }
      };
    };

    FF4.TYPES.Label = function (compose) {
      return {
        name: 'list of ' + compose.name,
        parse: function (values) {
          var that = this;
          var labels = {};

          foreach(values, function (value) {
            var label = compose.parse([value]);

            if ( labels.hasOwnProperty(label[0]) ) {
              throw new TypeError( that.name+': points must be unique' );
            }

            labels[label[0]] = label[1];
          });

          return labels;
        },
        stringify: function (labels) {
          var values = [];

          if ( !value || typeof value !== 'object' ) {
            throw new TypeError( that.name+': Object expected, got '+value );
          }

          foreach(keys(labels), function (key) {
            values.push( compose.stringify([key, labels[key]])[0] );
          });

          return values;
        }
      };
    };

    FF4.TYPES.elistOf = function (type) {
      return type && {
        name: 'elist of ' + type.name,
        parse: function (values) {
          var vals = [];

          if ( values.length > 1 || values[0] !== '' ) {
            foreach(values, function (value) {
              vals.push( type.parse([value]) );
            });
          }

          return vals;
        },
        stringify: function (values) {
          var vals = [];

          if ( !isArray(values) ){
            throw new TypeError( this.name+' expected, got '+values );
          }

          foreach(values, function (value) {
            vals.push( type.stringify(value)[0] );
          });

          return vals;
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
        LB : t.Label( t.Compose(t.Point, t.SimpleText) ),
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

  /*
   * Go (;FF[4]GM[1]) specific properties
   * http://www.red-bean.com/sgf/go.html
   */

  SGF.FF[4][1] = (function () {
    var FF = SGF.FF;
    var TYPES, PROPS;

    TYPES = Object.create( FF[4].TYPES );

    TYPES.Point = FF.TYPES.scalar({
      name: 'Point',
      like: /^[a-z]{2}$/i
    });
  
    TYPES.Stone = Object.create( TYPES.Point );
    TYPES.Stone.name = 'Stone';

    TYPES.Move = Object.create( TYPES.Point );
    TYPES.Move.name = 'Move';

    TYPES.listOfPoint = {
      name: 'list of Point',
      canBeNone: false,
      coord: (function () {
        var coords = {};

        var chars = 'abcdefghijklmnopqrstuvwxyz';
            chars = (chars + chars.toUpperCase()).split('');

        foreach(chars, function (char_, coord) {
          coords[char_] = coord;
        });

        return {
          toChar: chars,
          fromChar: coords
        };
      }()),
      parse: function (values) {
        var that = this;
        var coord = this.coord;
        var vals = [];

        if ( this.canBeNone && values.length === 1 && values[0] === '' ) {
          return vals;
        }

        foreach(values, function (value) {
          var points = value.match(/^([a-z])([a-z])(?::([a-z])([a-z]))?$/i);
          var isCompressed = points && points[3];

          var x1 = isCompressed && coord.fromChar[points[1]];
          var y1 = isCompressed && coord.fromChar[points[2]];
          var x2 = isCompressed && coord.fromChar[points[3]];
          var y2 = isCompressed && coord.fromChar[points[4]];

          var h;

          if ( isCompressed && x1 > x2 ) {
            h = x1; x1 = x2; x2 = h;
          }

          if ( isCompressed && y1 > y2 ) {
            h = y1; y1 = y2; y2 = h;
          }

          if ( isCompressed && (x1 !== x2 || y1 !== y2) ) {
            foreach(coord.toChar.slice(x1, x2+1), function (x) {
              foreach(coord.toChar.slice(y1, y2+1), function (y) {
                vals.push( x+y );
              });
            });
          }
          else if ( isCompressed ) {
            throw new TypeError( that.name+': 1x1 rectangle is not allowed' );
          }
          else if ( points ) {
            vals.push( value );
          }
          else {
            throw new TypeError( that.name+' expected, got '+quote(values) );
          }
        });

        return vals;
      },
      stringify: function (values) {
        var that = this;

        if ( !isArray(values) ) {
          throw new TypeError( this.name+': Array expected, got '+values );
        }

        foreach(values, function (value) {
          if ( !isString(value) && !value.match(/^[a-z]{2}$/i) ) {
            throw new TypeError( that.name+' expected, got '+quote(values) );
          }
        });

        return values;
      }
    };

    TYPES.elistOfPoint = Object.create( TYPES.listOfPoint );
    TYPES.elistOfPoint.name = 'elist of Point';
    TYPES.elistOfPoint.canBeNone = true;

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

  SGF.parse = (function () {
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

    return function (text, r) {
      var trees = collection( String(text) );
      var reviver = typeof r === 'function' && r;
      var FF = SGF.FF;
      var PROPS, ff;

      (function finalize (subtrees) {
        foreach(subtrees, function (tree) {
          var root, gm;

          if ( subtrees === trees ) { // direct descendant of Collection
            root = tree[0];

            ff = root.FF ? FF.TYPES.Number.parse(root.FF) : 1;
            gm = root.GM ? FF.TYPES.Number.parse(root.GM) : 1;

            if ( ff !== 4 && ff !== 3 && ff !== 1 ) {
              throw new Error( 'FF['+ff+'] is not supported' );
            }

            PROPS = FF[ff][gm] ? FF[ff][gm].PROPERTIES : FF[ff].properties();
          }

          foreach(tree.slice(0, tree.length-1), function (node) {
            foreach(keys(node), function (ident) {
              var values = node[ident];
              var id;

              if ( ff === 1 && !ident.match(/^[A-Z][A-Z\d]?$/) ) {
                throw new SyntaxError( 'Not a PropIdent: '+ident );
              }

              if ( ff === 3 ) {
                id = ident.replace(/[a-z]/g, '');

                if ( !id.match(/^[A-Z][A-Z\d]?$/) ) {
                  throw new SyntaxError( 'Not a PropIdent: '+ident );
                }

                if ( id !== ident && !node.hasOwnProperty(id) ) {
                  delete node[ident]; ident = id; // rename 'ident' to 'id'
                }
                else if ( id !== ident ) {
                  throw new SyntaxError( "Property '"+id+"' already exists" );
                }
              }

              if ( ff === 4 && !ident.match(/^[A-Z]+$/) ) {
                throw new SyntaxError( 'Not a FF[4] PropIdent: '+ident );
              }

              values = (PROPS[ident] || PROPS.unknown).parse(values);
              values = reviver ? reviver(ident, values) : values;

              if ( values !== undefined ) {
                node[ident] = values;
              }
              else {
                delete node[ident];
              }
            });
          });

          finalize( tree[tree.length-1] );
        });
      }(trees));

      return trees;
    };
  }());

  SGF.stringify = function (trees) {
    var text = '';
    var FF = SGF.FF;
    var ff, props;

    (function addGameTrees (subtrees) {
      if ( !isArray(subtrees) ) {
        throw new TypeError( 'Array expected, got '+subtrees );
      }

      foreach(subtrees, function (tree) {
        var root, gm;

        text += '('; // open GameTree

        if ( !isArray(tree) ) {
          throw new TypeError( 'Array expected, got '+tree );
        }

        if ( tree.length <= 1 ) {
          throw new TypeError( 'GameTree must contain at least one Node' );
        }

        if ( subtrees === trees ) { // direct descendant of Collection
          root = (tree[0] && typeof tree[0] === 'object') ? tree[0] : {};

          ff = root.hasOwnProperty('FF') && FF.TYPES.Number.stringify(root.FF);
          ff = ff ? parseInt(ff[0], 10) : 1;

          gm = root.hasOwnProperty('GM') && FF.TYPES.Number.stringify(root.GM);
          gm = gm ? parseInt(gm[0], 10) : 1;

          if ( ff !== 4 && ff !== 3 && ff !== 1 ) {
            throw new Error( 'FF['+ff+'] is not supported' );
          }

          props = FF[ff][gm] ? FF[ff][gm].PROPERTIES : FF[ff].properties();
        }

        foreach(tree.slice(0, tree.length-1), function (node) {
          text += ';'; // open Node

          if ( !node || typeof node !== 'object' ) {
            throw new TypeError( 'Object expected, got '+node );
          }

          foreach(keys(node), function (ident) {
            var values = node[ident];

            // ignore non-SGF properties
            if ( ff === 1 && !ident.match(/^[A-Z][A-Z\d]?$/) ) { return; }
            if ( ff === 3 && !ident.match(/^[A-Z][A-Z\d]?$/) ) { return; }
            if ( ff === 4 && !ident.match(/^[A-Z]+$/) ) { return; }

            // invoke toSGF method if it exists
            if ( values && typeof values === 'object' &&
                 typeof values.toSGF === 'function' ) {
              values = values.toSGF();
            }

            // NOTE: stringify method is responsible for escaping ']'
            values = (props[ident] || props.unknown).stringify(values);

            text += ident + '[' + values.join('][') + ']'; // add Property
          });
        });

        addGameTrees( tree[tree.length-1] );

        text += ')'; // close GameTree
      });
    }(trees));

    return text;
  };

  window.SGF = SGF;

}(this));

