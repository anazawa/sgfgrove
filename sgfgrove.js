/**
 * @overview SGFGrove.js
 * @author Ryo Anazawa
 * @version 0.0.1
 * @license MIT
 * @see http://www.red-bean.com/sgf/
 */
(function () {
  'use strict';

  var SGFGrove = {
    VERSION: '0.0.1'
  };

  var FF = {};

  var isNumber = function (value) {
    return typeof value === 'number' && isFinite(value);
  };

  var isString = function (value) {
    return typeof value === 'string';
  };

  var isArray = Array.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  var create = Object.create || function (prototype) {
    var Ctor = function () {};
    Ctor.prototype = prototype;
    return new Ctor();
  };

  var dump = function (value) {
    return (JSON.stringify(value) || '').slice(0, 32);
  };

  var assert = function (bool, name) {
    if ( !bool ) {
      throw new TypeError('Assertion'+(name ? ' ('+name+')' : '')+' failed');
    }
  };

  FF.Types = (function () {
    var Types = {};

    Types.scalar = function (args) {
      var spec = args || {};

      var like = spec.like || new RegExp('');
      var isa  = spec.isa  || function (v) { return isString(v) && like.test(v); };

      var parse     = spec.parse     || function (v) { return v; };
      var stringify = spec.stringify || function (v) { return String(v); };

      var that = {
        name: spec.name || ''
      };

      that.parse = function (values) {
        assert( values.length === 1 && like.test(values[0]), this.name );
        return parse(values[0]);
      };

      that.stringify = function (value) {
        assert( isa(value), this.name );
        return [ stringify(value) ];
      };

      return that;
    };

    // Number = ["+"|"-"] Digit {Digit}
    Types.Number = Types.scalar({
      name: 'Number',
      like: /^[+-]?\d+$/,
      isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
      parse: function (v) { return parseInt(v, 10); }
    });

    return Types;
  }());

  FF.properties = (function () {
    var prototype = {};
    
    prototype.unknown = {
      name: 'Unknown',
      parse: function (values) {
        var vals = [];

        for ( var i = 0; i < values.length; i++ ) {
          vals[i] = values[i].replace(/\\\]/g, ']');
        }

        return vals;
      },
      stringify: function (values) {
        var vals = [];

        assert( isArray(values), this.name );

        for ( var i = 0; i < values.length; i++ ) {
          assert( isString(values[i]), this.name );
          vals[i] = values[i].replace(/\]/g, '\\]');
        }

        return vals;
      }
    };

    prototype.find = function (key) {
      return (this.hasOwnProperty(key) && this[key]) || this.unknown;
    };

    return function (args) {
      var spec = args || {};
      var that = create( prototype );

      for ( var key in spec ) {
        if ( spec.hasOwnProperty(key) ) {
          that[key] = spec[key];
        }
      }

      return that;
    };
  }());

  FF.find = function (ff, gm) {
    if ( ff >= 1 && FF.hasOwnProperty(ff) ) {
      if ( gm >= 1 && FF[ff].hasOwnProperty(gm) ) {
        return FF[ff][gm].Properties;
      }
      return FF[ff].properties();
    }
    return FF.properties();
  };

  SGFGrove.define = function (ff, gm, cb) {
    var def = {};

    if ( ff && gm ) {
      FF[ff] = FF[ff] || {};
      FF[ff][gm] = cb.call(def, FF) || def;
    }
    else if ( ff ) {
      FF[ff] = cb.call(def, FF) || def;
    }
    else {
      FF = cb.call(def, FF) || def;
    }

    return;
  };

  SGFGrove.parse = (function () {
    var Num = FF.Types.Number;
    var source, lastIndex, reviver;

    var error = function (message) {
      var tail = source.slice(lastIndex).replace(/^\s*/, '').slice(0, 32);
      throw new SyntaxError( message+' at octet '+lastIndex+", '"+tail+"'" );
    };

    // Override RegExp's test and exec methods to let ^ behave like
    // the \G assertion (/\G.../gc). See also:
    // http://perldoc.perl.org/perlop.html#Regexp-Quote-Like-Operators
    
    var test = function () {
      this.lastIndex = 0;
      var bool = this.test( source.slice(lastIndex) );
      lastIndex = bool ? lastIndex+this.lastIndex : lastIndex;
      return bool;
    };

    var exec = function () {
      this.lastIndex = 0;
      var array = this.exec( source.slice(lastIndex) );
      lastIndex = array ? lastIndex+this.lastIndex : lastIndex;
      return array;
    };

    /* jshint boss:true */
    var gameTree = function () {
      var sequence = [];
      var subtrees = [], subtree;
      var node, ident, values, val;

      if ( !test.call(/^\s*\(\s*/g) ) { // start of GameTree
        return;
      }

      while ( test.call(/^;\s*/g) ) { // start of Node
        node = {};

        while ( ident = exec.call(/^([a-zA-Z0-9]+)\s*/g) ) { // PropIdent(-like)
          ident = ident[1].replace(/[a-z]/g, ''); // for FF[3]
          values = [];

          if ( node.hasOwnProperty(ident) ) {
            error( "Property '"+ident+"' already exists" );
          }

          while ( val = exec.call(/^\[((?:\\]|[^\]])*)\]\s*/g) ) { // PropValue
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

      if ( !test.call(/^\)\s*/g) ) { // end of GameTree
        error( "Unexpected token '"+source.charAt(lastIndex)+"'" );
      }

      return [ sequence, subtrees ];
    };
    /* jshint boss:false */

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
      var props, nodeId = 0;

      source = String(text);
      lastIndex = 0;
      reviver = typeof rev === 'function' && rev;

      while ( tree = gameTree() ) { // jshint ignore:line
        trees.push( tree );
      }

      if ( lastIndex !== source.length ) {
        error( "Unexpected token '"+source.charAt(lastIndex)+"'" );
      }

      (function finalize (subtrees) {
        var i, subtree, sequence, root, ff, gm;
        var j, node, id;

        for ( i = 0; i < subtrees.length; i++ ) {
          subtree = subtrees[i];
          sequence = subtree[0];

          if ( subtrees === trees ) {
            try {
              root = sequence[0];
              ff = root.hasOwnProperty('FF') ? Num.parse(root.FF) : 1;
              gm = root.hasOwnProperty('GM') ? Num.parse(root.GM) : 1;
              props = FF.find( ff, gm );
            }
            catch (error) {
              error.message += ' at node #'+nodeId+', '+dump(root);
              throw error;
            }
          }

          for ( j = 0; j < sequence.length; j++ ) {
            node = sequence[j];

            for ( id in node ) { // jshint ignore:line
              try {
                if ( !node.hasOwnProperty(id) ) { continue; }
                node[id] = props.find(id).parse(node[id]);
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

  SGFGrove.stringify = (function () {
    var Num = FF.Types.Number;
    var replacer, select;

    var finalize = function (key, holder) {
      var value = holder[key];
      var i, k, v;

      if ( value && typeof value === 'object' &&
           typeof value.toSGF === 'function' ) {
        value = value.toSGF();
      }

      if ( replacer ) {
        value = replacer.call( holder, key, value );
      }

      if ( !value || typeof value !== 'object' ) {
        v = value;
      }
      else if ( isArray(value) ) {
        v = [];
        for ( i = 0; i < value.length; i++ ) {
          v[i] = finalize( i, value );
        }
      }
      else if ( select ) {
        v = {};
        for ( i = 0; i < select.length; i++ ) {
          k = select[i];
          if ( value.hasOwnProperty(k) ) {
            v[k] = finalize( k, value );
          }
        }
      }
      else {
        v = {};
        for ( k in value ) {
          if ( value.hasOwnProperty(k) ) {
            v[k] = finalize( k, value );
          }
        }
      }

      return v;
    };

    return function (collection, rep, space) {
      var props, propIdents, id = 0;
      var indent = '', gap = '', lf;
      var i;

      select = undefined;
      replacer = undefined;

      if ( isArray(rep) ) {
        select = [];
        for ( i = 0; i < rep.length; i++ ) {
          if ( isString(rep[i]) ) {
            select.push( rep[i] );
          }
        }
      }
      else if ( typeof rep === 'function' ) {
        replacer = rep;
      }
      else if ( rep ) {
        throw new Error('replacer must be array or function');
      }

      if ( isNumber(space) ) {
        for ( i = 0; i < space; i++ ) {
          indent += ' ';
        }
      }
      else if ( isString(space) ) {
        indent = space;
      }

      lf = indent ? '\n' : '';
      collection = finalize( '', { '': collection } );

      return (function stringify (gameTrees) {
        var text = '', mind, prefix;
        var i, gameTree, sequence, root, ff, gm;
        var j, node, ident, values;

        assert( isArray(gameTrees), gameTrees === collection ? 'Collection' : 'GameTrees' );

        for ( i = 0; i < gameTrees.length; i++ ) {
          gameTree = gameTrees[i];
          assert( isArray(gameTree), 'GameTree' );

          sequence = gameTree[0];
          assert( isArray(sequence) && sequence.length, 'Sequence' );

          if ( gameTrees === collection ) {
            root = sequence[0];

            try {
              ff = root.hasOwnProperty('FF') ?
                   Num.parse( Num.stringify(root.FF) ) : 1;
              gm = root.hasOwnProperty('GM') ?
                   Num.parse( Num.stringify(root.GM) ) : 1;
            }
            catch (error) {
              error.message += ' at FF/GM of node #'+id+', '+dump(root);
              throw error;
            }

            propIdents = ff < 4 ? /^[A-Z][A-Z0-9]?$/ : /^[A-Z]+$/;
            props = FF.find( ff, gm );
          }
 
          text += gap + '(' + lf; // Open GameTree

          mind = gap;
          gap += indent;
          for ( j = 0; j < sequence.length; j++, id++ ) {
            node = sequence[j];
            assert( node && typeof node === 'object', 'Node' );

            prefix = gap + ';';
            for ( ident in node ) {
              if ( node.hasOwnProperty(ident) && propIdents.test(ident) ) {
                try {
                  values = props.find(ident).stringify(node[ident]);
                }
                catch (error) {
                  error.message += ' at '+ident+' of node #'+id+', '+dump(node);
                  throw error;
                }
                text += prefix + ident + '[' + values.join('][') + ']' + lf;
                prefix = indent ? gap+' ' : '';
              }
            }
          }

          text += stringify( gameTree[1] );
          text += mind + ')' + lf; // close GameTree

          gap = mind;
        }

        return text;
      }(collection));
    };
  }());

  SGFGrove.Util = {
    create: create,
    isNumber: isNumber,
    isArray: isArray
  };

  // File Format (;FF[4])
  // http://www.red-bean.com/sgf/sgf4.html
  // http://www.red-bean.com/sgf/properties.html
  SGFGrove.define('4', null, function (FF) {
    var Types = create( FF.Types );

    // None = ""
    Types.None = Types.scalar({
      name: 'None',
      like: /^$/,
      isa: function (v) { return v === null; },
      parse: function () { return null; },
      stringify: function () { return ''; }
    });

    // Real = Number ["." Digit { Digit }]
    Types.Real = Types.scalar({
      name: 'Real',
      like: /^[+-]?\d+(?:\.\d+)?$/,
      isa: isNumber,
      parse: parseFloat
    });

    // Double = ("1" | "2")
    Types.Double = Types.scalar({
      name: 'Double',
      like: /^[12]$/,
      isa: function (v) { return v === 1 || v === 2; },
      parse: parseInt
    });

    // Color = ("B" | "W")
    Types.Color = Types.scalar({
      name: 'Color',
      like: /^[BW]$/
    });

    // Text = { any character }
    Types.Text = Types.scalar({
      name: 'Text',
      parse: function (value) {
        return value.
          // remove soft linebreaks
          replace( /\\(?:\n\r?|\r\n?)/g, '' ).
          // convert white spaces other than linebreaks to space
          replace( /[^\S\n\r]/g, ' ' ).
          // insert escaped chars verbatim
          replace( /\\([\S\s])/g, '$1' );
      },
      stringify: function (value) {
        return value.replace(/([\]\\:])/g, '\\$1'); // escape "]", "\" and ":"
      }
    });

    // SimpleText = { any character }
    Types.SimpleText = Types.scalar({
      name: 'SimpleText',
      parse: function (value) {
        return value.
          // remove soft linebreaks
          replace( /\\(?:\n\r?|\r\n?)/g, '' ).
          // convert white spaces other than space to space even if it's escaped
          replace( /\\?[^\S ]/g, ' ' ).
          // insert escaped chars verbatim
          replace( /\\([\S\s])/g, '$1' );
      },
      stringify: function (value) {
        return value.replace(/([\]\\:])/g, '\\$1'); // escape "]", "\" and ":"
      }
    });

    Types.Compose = function (left, right) {
      return left && right && {
        name: 'composed '+left.name+' ":" '+right.name,
        parse: function (values) {
          var value = values[0].match(/^((?:\\:|[^:])*):([\S\s]*)$/);

          assert( values.length === 1 && value, this.name );

          return [
             left.parse( [value[1]] ),
            right.parse( [value[2]] )
          ];
        },
        stringify: function (value) {
          assert( isArray(value) && value.length === 2, this.name );

          return [
            left.stringify(value[0])[0] +
            ':' +
            right.stringify(value[1])[0]
          ];
        }
      };
    };
 
    Types.listOf = function (scalar, args) {
      var canBeEmpty = args && args.canBeEmpty === true;

      return scalar && {
        name: (canBeEmpty ? 'elist of ' : 'list of ')+scalar.name,
        canBeEmpty: canBeEmpty,
        parse: function (values) {
          var vals = [];

          if ( values.length === 1 && values[0] === '' ) {
            assert( this.canBeEmpty, this.name );
            return vals;
          }

          for ( var i = 0; i < values.length; i++ ) {
            vals[i] = scalar.parse([values[i]]);
          }

          return vals;
        },
        stringify: function (values) {
          var vals = [];

          assert( isArray(values), this.name );

          if ( values.length ) {
            for ( var i = 0; i < values.length; i++ ) {
              vals[i] = scalar.stringify(values[i])[0];
            }
          }
          else {
            assert( this.canBeEmpty, this.name );
            vals[0] = '';
          }

          return vals;
        }
      };
    };

    Types.elistOf = function (scalar) {
      return Types.listOf(scalar, { canBeEmpty: true });
    };

    Types.BoardSize = function (square, rectangular) {
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

    Types.Figure = function (none, compose) {
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

    this.Types = Types;

    this.properties = function (args) {
      var t = args || Types;

      return FF.properties({
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
        VM : t.elistOfPoint || t.elistOf( t.Point )
      });
    };

    return;
  });

  // Go (;FF[4]GM[1]) specific properties
  // http://www.red-bean.com/sgf/go.html
  SGFGrove.define('4', '1', function (FF) {
    var Types = create( FF[4].Types );
    var Props;

    var push = Array.prototype.push;

    var expandPointList = (function () {
      var coord = 'abcdefghijklmnopqrstuvwxyz';
          coord += coord.toUpperCase();

      var charCoordAt = function (at) {
        var code = this.charCodeAt(at);
        return code >= 97 ? code-97 : code-65+26;
      };

      return function (p1, p2) {
        var points = [];
        var x, y, h;

        var x1 = charCoordAt.call( p1, 0 );
        var y1 = charCoordAt.call( p1, 1 );
        var x2 = charCoordAt.call( p2, 0 );
        var y2 = charCoordAt.call( p2, 1 );

        if ( x1 > x2 ) {
          h = x1; x1 = x2; x2 = h;
        }

        if ( y1 > y2 ) {
          h = y1; y1 = y2; y2 = h;
        }

        for ( y = y1; y <= y2; y++ ) {
          for ( x = x1; x <= x2; x++ ) {
            points.push( coord.charAt(x)+coord.charAt(y) );
          }
        }

        return points;
      };
    }());

    Types.Point = Types.scalar({
      name: 'Point',
      like: /^[a-zA-Z]{2}$/
    });
  
    Types.Stone = create( Types.Point );
    Types.Stone.name = 'Stone';

    Types.Move = Types.scalar({
      name: 'Move',
      like: /^(?:[a-zA-Z]{2})?$/,
      isa: function (v) { return v === null || (isString(v) && /^[a-zA-Z]{2}$/.test(v)); },
      parse: function (v) { return v === '' ? null : v; },
      stringify: function (v) { return v === null ? '' : v; }
    });

    Types.listOfPoint = {
      name: 'list of Point',
      canBeEmpty: false,
      parse: function (values) {
        var vals = [];
        var i, points;

        if ( this.canBeEmpty && values.length === 1 && values[0] === '' ) {
          return vals;
        }

        for ( i = 0; i < values.length; i++ ) {
          points = /^([a-zA-Z]{2})(?::([a-zA-Z]{2}))?$/.exec( values[i] );
          assert( points, this.name );

          if ( points[2] ) {
            push.apply( vals, expandPointList(points[1], points[2]) );
          }
          else {
            vals.push( points[0] );
          }
        }

        return vals;
      },
      stringify: function (values) {
        assert(
          isArray(values) && (this.canBeEmpty || values.length > 0),
          this.name
        );

        for ( var i = 0; i < values.length; i++ ) {
          assert(
            isString(values[i]) &&
            /^[a-zA-Z]{2}(?::[a-zA-Z]{2})?$/.test(values[i]),
            this.name
          );
        }

        return values;
      }
    };

    Types.elistOfPoint = create( Types.listOfPoint );
    Types.elistOfPoint.name = 'elist of Point';
    Types.elistOfPoint.canBeEmpty = true;

    Types.listOfStone = create( Types.listOfPoint );
    Types.listOfStone.name = 'list of Stone';

    Types.elistOfStone = create( Types.elistOfPoint );
    Types.elistOfStone.name = 'elist of Stone';
    
    Props = FF[4].properties( Types );

    Props.HA = Types.Number;
    Props.KM = Types.Real;
    Props.TB = Types.elistOfPoint;
    Props.TW = Types.elistOfPoint;

    this.Types = Types;
    this.Properties = Props;

    return;
  });

  if ( typeof exports !== 'undefined' ) {
    module.exports = SGFGrove; // jshint ignore:line
  }
  else {
    window.SGFGrove = SGFGrove;
  }

}());

