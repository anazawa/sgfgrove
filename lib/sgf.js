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

  var SGF = {};

  SGF.FF = (function () {
    var FF = {};

    FF.typeError = function (type, message) {
      return {
        name: 'TypeError',
        message: message,
        pos: null,
        got: null,
        type: type,
        toString: function () {
          return this.name + ": " + this.type.name + " expected, " +
                 "got '" + this.got.join("', '") + "'" +
                 (this.message ? ': '+this.message+' ' : ' ') +
                  'at prop ' + this.pos.prop + ' of node #' + this.pos.nodeId;
        }
      };
    };

    FF.types = {};

    FF.types.scalar = function (args) {
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
          throw FF.typeError( this );
        }

        return parse(value);
      };

      that.stringify = function (value) {
        if ( !isa(value) ) { 
          throw FF.typeError( this );
        }

        return [ stringify(value) ];
      };

      return that;
    };

    /*
     * File Format (;FF[4])
     */

    FF[4] = {};

    FF[4].types = {};

    FF[4].types.None = FF.types.scalar({
      name: 'None',
      like: /^$/
    });

    FF[4].types.Number = FF.types.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });

    FF[4].types.Real = FF.types.scalar({
      name: 'Real',
      like: /^[+-]?\d+(?:\.\d+)?$/,
      isa: isNumber,
      parse: parseFloat
    });

    FF[4].types.Double = FF.types.scalar({
      name: 'Double',
      like: /^[12]$/,
      isa: function (v) { return v === 1 || v === 2; },
      parse: function (v) { return parseInt(v, 10); }
    });

    FF[4].types.Color = FF.types.scalar({
      name: 'Color',
      like: /^[BW]$/
    });

    FF[4].types.SimpleText = FF.types.scalar({
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
        return value.replace(/([\]\\:])/, '\\$1'); // escape "]", "\" and ":"
      }
    });

    FF[4].types.Text = FF.types.scalar({
      name: 'Text',
      isa: isString,
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
        return value.replace(/([\]\\:])/, '\\$1'); // escape "]", "\" and ":"
      }
    });

    FF[4].types.Compose = function (left, right) {
      return left && right && {
        name: 'composed ' + left.name + ' ":" ' + right.name,
        parse: function (values) {
          var value = values[0].match(/^((?:[^\\:]+|\\.)*):(.*)$/);

          if ( values.length > 1 || !value ) {
            throw FF.typeError( this );
          }

          return [
             left.parse( [value[1]] ),
            right.parse( [value[2]] )
          ];
        }
      };
    };

    FF[4].types.BoardSize = function (square, rectangular) {
      return square && rectangular && {
        name: square.name + ' or ' + rectangular.name,
        parse: function (values) {
          var type = values[0].match(/:/) ? rectangular : square;
          var value;

          try {
            value = type.parse( values );
          }
          catch (error) {
            throw FF.typeError( this, error.message );
          }

          return value;
        }
      };
    };

    FF[4].types.Figure = function (none, compose) {
      return none && compose && {
        name: none.name + ' or ' + compose.name,
        parse: function (values) {
          var type = values[0].match(/:/) ? compose : none;
          var value;

          try {
            value = type.parse( values );
          }
          catch (error) {
            throw FF.typeError( this, error.message );
          }

          return value;
        }
      };
    };

    FF[4].types.Label = function (label) {
      return {
        name: 'list of ' + label.name,
        parse: function (values) {
          var that = this;
          var labels = {};

          foreach(values, function (value) {
            try {
              var l = label.parse([value]);
            }
            catch (error) {
              throw FF.typeError( that, error.message );
            }
            if ( labels.hasOwnProperty(l[0]) ) {
              throw FF.typeError( that, 'points must be unique' );
            }
            labels[l[0]] = l[1];
          });

          return labels;
        }
      };
    };

    FF[4].types.listOf = function (type) {
      return type && {
        name: 'list of ' + type.name,
        parse: function (values) {
          var that = this;
          var vals = [];

          foreach(values, function (value) {
            try {
              vals.push( type.parse([value], pos) );
            }
            catch (error) {
              throw FF.typeError( that, error.message );
            }
          });

          return vals;
        }
      };
    };

    FF[4].types.elistOf = function (type) {
      return type && {
        name: 'elist of ' + type.name,
        parse: function (values) {
          var that = this;
          var vals = [];

          if ( values.length > 1 || values[0] !== '' ) {
            foreach(values, function (value) {
              try {
                vals.push( type.parse([value]) );
              }
              catch (error) {
                throw FF.typeError( that, error.message );
              }
            });
          }

          return vals;
        }
      };
    };

    FF[4].types.Unknown = {
      name: 'Unknown',
      parse: function (values) {
        var vals = [];

        foreach(values, function (value) {
          vals.push( value.replace(/\\\[/, '[') );
        });

        return vals;
      },
      stringify: function (values) {
        var vals = [];

        foreach(values, function (value) {
          vals.push( (''+value).replace(/\[/, '\\[') );
        });

        return vals;
      }
    };

    FF[4].props = function (types) {
      var t = types || FF[4].types;

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

    /*
     * Go (;FF[4]GM[1]) specific properties
     */
   
    FF[4][1] = {};

    FF[4][1].types = Object.create( FF[4].types );

    FF[4][1].types.Point = FF.types.scalar({
      name: 'Point',
      like: /^[a-z]{2}$/i
    });
  
    FF[4][1].types.Stone = Object.create( FF[4][1].types.Point );
    FF[4][1].types.Stone.name = 'Stone';

    FF[4][1].types.Move = Object.create( FF[4][1].types.Point );
    FF[4][1].types.Move.name = 'Move';

    FF[4][1].types.listOfPoint = {
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
            throw FF.typeError( that, '1x1 rectangle is not allowed' );
          }
          else if ( points ) {
            vals.push( value );
          }
          else {
            throw FF.typeError( that );
          }
        });

        return vals;
      }
    };

    FF[4][1].types.elistOfPoint = Object.create( FF[4][1].types.listOfPoint );
    FF[4][1].types.elistOfPoint.name = 'elist of Point';
    FF[4][1].types.elistOfPoint.canBeNone = true;

    FF[4][1].types.listOfStone = Object.create( FF[4][1].types.listOfPoint );
    FF[4][1].types.listOfStone.name = 'list of Stone';

    FF[4][1].types.elistOfStone = Object.create( FF[4][1].types.elistOfPoint );
    FF[4][1].types.elistOfStone.name = 'elist of Stone';
    
    FF[4][1].props = FF[4].props( FF[4][1].types );

    FF[4][1].props.HA = FF[4][1].types.Number;
    FF[4][1].props.KM = FF[4][1].types.Real;
    FF[4][1].props.TB = FF[4][1].types.elistOfPoint;
    FF[4][1].props.TW = FF[4][1].types.elistOfPoint;

    return FF;
  }());

  SGF.parse = (function () {
    var FF = SGF.FF;
    var text, at, ch, reviver;

    var syntaxError = function (message) {
      return {
        name: 'SyntaxError',
        message: message || '',
        text: text,
        at: at,
        toString: function () {
          var tail = this.text.slice( this.at, this.at+32 );
          return this.name + (this.message ? ': ' + this.message : '') +
                 ' at octet ' + this.at + ", '" + tail + "'";
        }
      };
    };

    var next = function (expected) {
      if ( expected && expected !== ch ) {
        throw syntaxError("'"+expected+"' expected, got '"+ch+"'");
      }
      at += 1;
      ch = text.charAt( at );
      return ch;
    };

    var whiteSpaces = function () {
      while ( ch && ch <= ' ' ) {
        next();
      }
    };

    var collection = function () {
      var trees = [];
      var nodeId = 0;

      whiteSpaces();

      while ( ch === '(' ) { // start of GameTree
        trees.push( gameTree() );
      }

      if ( ch ) {
        throw syntaxError();
      }

      (function parseProps (subtrees, ff, props) {
        foreach(subtrees, function (tree) {
          var gm;

          if ( subtrees === trees ) { // direct descendant of Collection
            ff = tree[0].FF;
            gm = tree[0].GM;

            if ( !ff ) {
              ff = 1;
            }
            else if ( ff.length === 1 && ff[0].match(/^[134]$/) ) {
              ff = parseInt( ff[0], 10 );
            }
            else {
              throw 'unknown file format';
            }

            if ( !gm ) {
              gm = 1;
            }
            else if ( gm.length === 1 && gm[0].match(/^\d+$/) ) {
              gm = parseInt( gm[0], 10 );
            }
            else {
              throw 'unknown game type';
            }

            props = FF[ff][gm] ? FF[ff][gm].props : FF[ff].props();
          }

          foreach(tree.slice(0, tree.length-1), function (node) {
            foreach(keys(node), function (key) {
              var prop = props[key] || props.unknown;

              if ( ff === 4 && key.match(/\d/) ) {
                throw 'Not a PropIdent';
              }

              try {
                node[key] = prop.parse( node[key] );
              }
              catch (error) {
                error.pos = { nodeId: nodeId, prop: key };
                error.got = node[key];
                throw error;
              }

              if ( reviver ) {
                node[key] = reviver( key, node[key] );
              }

              if ( node[key] === undefined ) {
                delete node[key];
              }
            });

            nodeId += 1;
          });

          parseProps( tree[tree.length-1], ff, props );
        });
      }(trees));

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
        throw syntaxError('GameTree must contain at least one Node');
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

      while ( ch && ch.match(/[A-Z]/) ) { // start of PropIdent
        ident = propIdent();
        values = [];

        while ( ch === '[' ) { // start of PropValue
          values.push( propValue() );
        }

        if ( !values.length ) {
          throw syntaxError('PropValue is missing');
        }

        props[ident] = values;
      }

      return props;
    };

    var propIdent = function () {
      var ident = '';

      while ( ch && ch.match(/[A-Z\d]/) ) { // UcLetter or Digit
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

      while ( (prev === '\\' && ch === ']') || ch !== ']' ) {
        value += ch;
        prev = ch;
        next();
      }

      next(']'); // end of PropValue

      whiteSpaces();

      return value;
    };

    return function (t, r) {
      text = String(t);
      at = 0;
      ch = text.charAt(at);
      reviver = typeof r === 'function' && r;
      return collection();
    };
  }());

  SGF.stringify = function (trees) {
    var FF = SGF.FF;
    var string = '';
    var nodeId = 0;

    var typeError = function (message) {
      return {
        name: 'TypeError',
        message: message || '',
        toString: function () {
          return this.name + (this.message ? ': '+this.message : '');
        }
      };
    };

    (function stringify (subtrees, ff, props) {
      if ( !isArray(subtrees) ) {
        throw typeError('Array expected, got '+subtrees);
      }
      foreach(subtrees, function (tree) {
        var root, gm;

        string += '('; // start of GameTree

        if ( !isArray(tree) ) {
          throw typeError('Array expected, got '+tree);
        }

        if ( tree.length <= 1 ) {
          throw typeError('GameTree must contain at least one Node');
        }

        if ( subtrees === trees ) { // direct descendant of Collection
          root = (tree[0] && typeof tree[0] === 'object') ? tree[0] : {};

          if ( !root.hasOwnProperty('FF') ) {
            ff = 1;
          }
          else if ( isNumber(root.FF) && (''+root.FF).match(/^[134]$/) ) {
            ff = root.FF;
          }
          else {
            throw 'unknown file format';
          }

          if ( !root.hasOwnProperty('GM') ) {
            gm = 1;
          }
          else if ( isNumber(root.GM) ) {
            gm = root.GM;
          }
          else {
            throw 'unknown game type';
          }

          props = FF[ff][gm] ? FF[ff][gm].props : FF[ff].props();
        }

        foreach(tree.slice(0, tree.length-1), function (node) {
          string += ';'; // start of Node

          if ( !node || typeof node !== 'object' ) {
            throw typeError('Object expected, got '+node);
          }

          foreach(keys(node), function (key) {
            var prop = props[key] || props.unknown;
            var value = node[key];
            var values;

            if ( !key.match(/^[A-Z][A-Z\d]*$/) ) {
              return; // ignore user-defined properties
            }

            if ( ff === 4 && key.match(/\d/) ) {
              throw typeError('Not a PropIdent');
            }

            if ( value && typeof value === 'object' &&
                 typeof value.toSGF === 'function' ) {
              value = value.toSGF();
            }

            try {
              values = prop.stringify( value );
            }
            catch (error) {
              error.pos = { nodeId: nodeId, prop: key };
              error.got = node[key];
              throw error;
            }

            string += key + '[' + values.join('][') + ']'; // Property
          });

          nodeId += 1;
        });

        stringify( tree[tree.length-1], ff, props );

        string += ')'; // end of GameTree
      });
    }(trees));

    return string;
  };

  window.SGF = SGF;

}(this));

