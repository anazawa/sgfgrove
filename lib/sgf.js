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

    var quote = function (a) { return "'"+a.join("', '")+"'"; };

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

    FF.types.Number = FF.types.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });

    /*
     * File Format (;FF[4])
     */

    FF[4] = {};

    FF[4].types = {
      Number: FF.types.Number
    };

    FF[4].types.None = FF.types.scalar({
      name: 'None',
      like: /^$/
    });

    /*
    FF[4].types.Number = FF.types.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });
    */

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
            throw new TypeError( this.name+' expected, got '+quote(values) );
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
          return (values[0].match(/:/) ? rectangular : square).parse(values);
        },
        stringify: function (values) {
          return (isArray(values) ? rectangular : square).stringify(values);
        }
      };
    };

    FF[4].types.Figure = function (none, compose) {
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

    FF[4].types.Label = function (compose) {
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
        stringify: function (value) {
          var values = [];

          if ( !value || typeof value !== 'object' ) {
            throw new TypeError( that.name+': Object expected, got '+value );
          }

          foreach(keys(value), function (key) {
            values.push( compose.stringify([key, value[key]]) );
          });

          return values;
        }
      };
    };

    FF[4].types.listOf = function (type) {
      return type && {
        name: 'list of '+type.name,
        parse: function (values) {
          var that = this;
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
            vals.push( type.stringify(value) );
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
                throw new TypeError( that.name+': '+error.message );
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
          vals.push( value.replace(/\\\]/g, ']') );
        });

        return vals;
      },
      stringify: function (values) {
        var that = this;
        var vals = [];

        if ( !isArray(values) ) {
          throw new TypeError( this.name+': Array expected, got '+values );
        }

        foreach(values, function (value) {
          if ( isString(value) ) {
            vals.push( value.replace(/\]/g, '\\]') );
          }
          else {
            throw new TypeError( that.name+': String expected, got '+value );
          }
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
      var ff, props;

      (function finalize (subtrees) {
        foreach(subtrees, function (tree) {
          var root, gm;

          if ( subtrees === trees ) { // direct descendant of Collection
            root = tree[0];

            ff = root.FF ? FF.types.Number.parse(root.FF) : 1;
            gm = root.GM ? FF.types.Number.parse(root.GM) : 1;

            if ( ff !== 4 && ff !== 3 && ff !== 1 ) {
              throw new Error( 'FF['+ff+'] is not supported' );
            }

            props = FF[ff][gm] ? FF[ff][gm].props : FF[ff].props();
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
                throw new SyntaxError( 'Not a PropIdent: '+ident );
              }

              values = (props[ident] || props.unknown).parse(values);
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

          ff = root.hasOwnProperty('FF') && FF.types.Number.stringify(root.FF);
          ff = ff ? parseInt(ff[0], 10) : 1;

          gm = root.hasOwnProperty('GM') && FF.types.Number.stringify(root.GM);
          gm = gm ? parseInt(gm[0], 10) : 1;

          if ( ff !== 4 && ff !== 3 && ff !== 1 ) {
            throw new Error( 'FF['+ff+'] is not supported' );
          }

          props = FF[ff][gm] ? FF[ff][gm].props : FF[ff].props();
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

