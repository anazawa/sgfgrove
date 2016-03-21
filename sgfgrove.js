/**
 * @overview SGFGrove.js
 * @author Ryo Anazawa
 * @version 1.0.2
 * @license MIT
 * @see http://www.red-bean.com/sgf/
 */
(function () {
    "use strict";

    var FF = {};

    var SGFGrove = {
        VERSION: "1.0.2"
    };

    if ( typeof exports !== "undefined" ) {
        module.exports = SGFGrove; // jshint ignore:line
    }
    else {
        window.SGFGrove = SGFGrove;
    }

    SGFGrove.Util = (function () {
        var Util = {};

        Util.isNumber = function (value) {
            return typeof value === "number" && isFinite(value);
        };

        Util.isInteger = function (value) {
            return Util.isNumber(value) && Math.floor(value) === value;
        };

        Util.isArray = Array.isArray || function (value) {
            return Object.prototype.toString.call(value) === "[object Array]";
        };

        Util.create = Object.create || function (obj) {
            var Ctor = function () {};
            Ctor.prototype = obj;
            return new Ctor();
        };

        return Util;
    }());

    FF.Types = (function () {
        var Types = {};

        Types.scalar = function (args) {
            args = args || {};

            var that = {};

            var like = args.like || { test: function () { return true; } };
            var parse = args.parse || function (v) { return v; };

            var isa = args.isa || function (v) { return typeof v === "string" && like.test(v); };
            var stringify = args.stringify || String;

            that.parse = function (values) {
                if (values.length === 1 && like.test(values[0])) {
                    return parse(values[0]);
                }
            };

            that.stringify = function (value) {
                if (isa(value)) {
                    return [stringify(value)];
                }
            };

            return that;
        };

        // Number = ["+"|"-"] Digit {Digit}
        Types.Number = Types.scalar({
            like: /^[+-]?\d+$/,
            isa: SGFGrove.Util.isInteger,
            parse: function (v) { return parseInt(v, 10); }
        });

        Types.Unknown = {
            parse: function (values) {
                var result = [];

                for (var i = 0; i < values.length; i++) {
                    result[i] = values[i].replace(/\\\]/g, "]");
                }

                return result;
            },
            stringify: function (values) {
                if (SGFGrove.Util.isArray(values)) {
                    var result = [];

                    for (var i = 0; i < values.length; i++) {
                        if (typeof values[i] === "string") {
                            result[i] = values[i].replace(/\]/g, "\\]");
                        }
                        else {
                            return;
                        }
                    }

                    return result;
                }
            }
        };

        return Types;
    }());

    FF.properties = function (t, args) {
        t = t || FF.Types;
        args = args || {};

        var that = {
            types       : args.types       || {},
            defaultType : args.defaultType || t.Unknown,
            identifiers : args.identifiers || { test: function () { return false; } }
        };

        that.getType = function (ident) {
            return this.types[ident] || this.defaultType;
        };

        that.mergeTypes = function (other) {
            var types = this.types;

            for ( var ident in other ) {
                if ( other.hasOwnProperty(ident) && other[ident] ) {
                    types[ident] = other[ident];
                }
            }

            return types;
        };

        that.isIdentifier = function (ident) {
            return this.identifiers.test(ident);
        };

        return that;
    };

    FF.createProperties = function (ff, gm) {
        if ( SGFGrove.Util.isInteger(ff) && FF.hasOwnProperty(ff) ) {
            if ( SGFGrove.Util.isInteger(gm) && FF[ff].hasOwnProperty(gm) ) {
                return FF[ff][gm].properties();
            }
            return FF[ff].properties();
        }
        return FF.properties();
    };

    SGFGrove.parse = (function () {
        var SGFNumber = FF.Types.Number;
        var text, lastIndex, reviver;

        // Override RegExp's test and exec methods to let ^ behave like
        // the \G assertion (/\G.../gc). See also:
        // http://perldoc.perl.org/perlop.html#Regexp-Quote-Like-Operators

        var test = function () {
            var bool = this.test( text.slice(lastIndex) );
            lastIndex += this.lastIndex;
            this.lastIndex = 0;
            return bool;
        };

        var exec = function () {
            var array = this.exec( text.slice(lastIndex) );
            lastIndex += this.lastIndex;
            this.lastIndex = 0;
            return array;
        };

        /* jshint boss:true */
        var parseGameTree = function (properties) {
            var sequence = [], node, ident, values, v, type, str;
            var children = [], child;

            if ( !test.call(/^\s*\(\s*/g) ) { // start of GameTree
                return;
            }

            while ( test.call(/^;\s*/g) ) { // start of Node
                node = {};

                while ( ident = exec.call(/^([a-zA-Z0-9]+)\s*/g) ) { // PropIdent(-like)
                    ident = ident[1].replace(/[a-z]/g, ""); // for FF[3]
                    values = [];

                    if ( !ident ) {
                        throw new SyntaxError("PropIdent is missing");
                    }
                    else if ( node.hasOwnProperty(ident) ) {
                        throw new SyntaxError("Property "+ident+" already exists");
                    }

                    while ( v = exec.call(/^\[((?:\\]|[^\]])*)\]\s*/g) ) { // PropValue
                        values.push( v[1] );
                    }

                    if ( !values.length ) {
                        throw new SyntaxError("PropValue of "+ident+" is missing");
                    }

                    node[ident] = values;
                }

                properties = properties || FF.createProperties(
                    node.hasOwnProperty("FF") ? SGFNumber.parse(node.FF) : 1,
                    node.hasOwnProperty("GM") ? SGFNumber.parse(node.GM) : 1
                );

                for ( ident in node ) {
                    if ( node.hasOwnProperty(ident) ) {
                        type = properties.getType(ident);
                        values = type.parse(node[ident]);
                        if ( values !== undefined ) {
                            node[ident] = values;
                        }
                        else {
                            str = ident+"["+node[ident].join("][")+"]";
                            //throw new SyntaxError(type.name+" expected, got "+str);
                            throw new SyntaxError("Invalid Property: "+str);
                        }
                    }
                }
 
                sequence.push( node );
            }

            if ( !sequence.length ) {
                throw new SyntaxError("GameTree does not contain any Nodes");
            }

            while ( child = parseGameTree(properties) ) {
                children.push( child );
            }

            if ( !test.call(/^\)\s*/g) ) { // end of GameTree
                throw new SyntaxError("Unexpected token "+text.charAt(lastIndex));
            }

            // (;a(;b)) => (;a;b)
            if ( children.length === 1 ) {
                sequence = sequence.concat( children[0][0] );
                children = children[0][1];
            }

            return [sequence, children];
        };
        /* jshint boss:false */

        // Copied and rearranged from json2.js so that we can pass the same
        // callback to both of SGF.parse and JSON.parse
        // https://github.com/douglascrockford/JSON-js/blob/master/json2.js
        var walk = function (holder, key) {
            var value = holder[key];

            if ( value && typeof value === "object" ) {
                for ( var k in value ) {
                    if ( value.hasOwnProperty(k) ) {
                        var v = walk(value, k);
                        if ( v !== undefined ) {
                            value[k] = v;
                        }
                        else {
                            delete value[k];
                        }
                    }
                }
            }

            return reviver.call(holder, key, value);
        };

        return function (source, rev) {
            var collection = [], gameTree;

            text = String(source);
            lastIndex = 0;
            reviver = typeof rev === "function" && rev;

            while ( gameTree = parseGameTree() ) { // jshint ignore:line
                collection.push( gameTree );
            }

            if ( lastIndex !== text.length ) {
                throw new SyntaxError("Unexpected token "+text.charAt(lastIndex));
            }

            return reviver ? walk({ "": collection }, "") : collection;
        };
    }());

    SGFGrove.stringify = (function () {
        var isArray = SGFGrove.Util.isArray;
        var replacer, selected, indent, gap;

        var finalize = function (key, holder) {
            var value = holder[key];
            var i, k, v;

            if (value && typeof value === "object" &&
                typeof value.toSGF === "function") {
                value = value.toSGF(key);
            }

            if (replacer) {
                value = replacer.call(holder, key, value);
            }

            if (!value || typeof value !== "object") {
                v = value;
            }
            else if (isArray(value)) {
                v = [];
                for ( i = 0; i < value.length; i++ ) {
                    v[i] = finalize(i, value);
                }
            }
            else {
                v = {};
                if (selected) {
                    for (i = 0; i < selected.length; i++) {
                        v[selected[i]] = finalize(selected[i], value);
                    }
                }
                else {
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            v[k] = finalize(k, value);
                        }
                    }
                }
            }

            return v;
        };
 
        var stringifyGameTree = function (gameTree, properties) {
            gameTree = isArray(gameTree) ? gameTree : [];

            var sequence = isArray(gameTree[0]) ? gameTree[0] : [],
                children = isArray(gameTree[1]) ? gameTree[1] : [],
                node, ident, values, i;

            var text = "",
                lf = indent ? "\n" : "",
                mind = gap,
                partial, semicolon, space;

            // (;a(;b)) => (;a;b)
            if (children.length === 1) {
                sequence = sequence.concat(isArray(children[0][0]) ? children[0][0] : []);
                children = isArray(children[0][1]) ? children[0][1] : [];
            }

            if (sequence.length) {
                text += gap+"("+lf; // open GameTree
                gap += indent;
                semicolon = gap+";";
                space = gap+(indent ? " " : "");

                for (i = 0; i < sequence.length; i++) {
                    node = sequence[i] && typeof sequence[i] === "object" ? sequence[i] : {};
                    partial = [];
                        
                    properties = properties || FF.createProperties(
                        node.hasOwnProperty("FF") ? node.FF : 1,
                        node.hasOwnProperty("GM") ? node.GM : 1
                    );

                    for (ident in node) {
                        if (node.hasOwnProperty(ident) && properties.isIdentifier(ident)) {
                            values = properties.getType(ident).stringify(node[ident]);
                            if (values) {
                                partial.push(ident+"["+values.join("][")+"]");
                            }
                        }
                    }

                    text += semicolon+partial.join(lf+space)+lf; // add Node
                }

                for (i = 0; i < children.length; i++) {
                    text += stringifyGameTree(children[i], properties); // add GameTree
                }

                text += mind+")"+lf; // close GameTree
                gap = mind;
            }

            return text;
        };

        return function (collection, rep, space) {
            var text, i;

            replacer = null;
            selected = null;
            indent = "";
            gap = "";

            if (isArray(rep)) {
                selected = [];
                for (i = 0; i < rep.length; i++) {
                    if (typeof rep[i] === "string") {
                        selected.push(rep[i]);
                    }
                }
            }
            else if (typeof rep === "function") {
                replacer = rep;
            }
            else if (rep) {
                throw new Error("replacer must be array or function");
            }

            if (typeof space === "number") {
                for (i = 0; i < space; i++) {
                    indent += " ";
                }
            }
            else if (typeof space === "string") {
                indent = space;
            }

            collection = finalize("", { "": collection });

            if (isArray(collection)) {
                text = "";
                for (i = 0; i < collection.length; i++) {
                    text += stringifyGameTree(collection[i]);
                }
            }

            return text;
        };
    }());

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

    // File Format (;FF[4])
    // http://www.red-bean.com/sgf/sgf4.html
    // http://www.red-bean.com/sgf/properties.html
    SGFGrove.define(4, null, function (FF) {
        var Types = SGFGrove.Util.create(FF.Types);
        var isArray = SGFGrove.Util.isArray;

        Types.compose = function (left, right) {
            return left && right && {
                parse: function (values) {
                    if (values.length === 1) {
                        var v = /^((?:\\:|[^:])*):([\s\S]*)$/.exec(values[0]) || undefined;
                        var l = v && left.parse([v[1]]);
                        var r = v && right.parse([v[2]]);
                        if (l !== undefined && r !== undefined) {
                            return [l, r];
                        }
                    }
                },
                stringify: function (value) {
                    if (isArray(value) && value.length === 2) {
                        var l = left.stringify(value[0]);
                        var r = right.stringify(value[1]);
                        return l && r && [ l[0]+":"+r[0] ];
                    }
                }
            };
        };

        Types.listOf = function (scalar, args) {
            args = args || {};

            return scalar && {
                canBeEmpty: args.canBeEmpty,
                parse: function (values) {
                    var result = [];

                    if (values.length === 1 && values[0] === "") {
                        return this.canBeEmpty ? result : undefined;
                    }

                    for (var i = 0; i < values.length; i++) {
                        result[i] = scalar.parse([values[i]]);
                        if (result[i] === undefined) {
                            return;
                        }
                    }

                    return result;
                },
                stringify: function (values) {
                    if (!isArray(values)) {
                        return;
                    }

                    if (!values.length) {
                        return this.canBeEmpty ? [""] : undefined;
                    }

                    var result = [];

                    for ( var i = 0; i < values.length; i++ ) {
                        result[i] = scalar.stringify(values[i])[0];
                        if ( result[i] === undefined ) {
                            return;
                        }
                    }

                    return result;
                },
                toElist: function () {
                    var other = SGFGrove.Util.create(this);
                    other.canBeEmpty = true;
                    return other;
                }
            };
        };

        Types.elistOf = function (scalar) {
            return Types.listOf(scalar, {
                canBeEmpty: true
            });
        };

        Types.or = function (a, b) {
            return a && b && {
                parse: function (values) {
                    var result = a.parse(values);
                    return result !== undefined ? result : b.parse(values);
                },
                stringify: function (value) {
                    return a.stringify(value) || b.stringify(value);
                }
            };
        };

        // None = ""
        Types.None = Types.scalar({
            like: { test: function (v) { return v === ""; } },
            isa: function (v) { return v === null; },
            parse: function () { return null; },
            stringify: function () { return ""; }
        });

        // Real = Number ["." Digit { Digit }]
        Types.Real = Types.scalar({
            like: /^[+-]?\d+(?:\.\d+)?$/,
            isa: SGFGrove.Util.isNumber,
            parse: parseFloat
        });

        // Double = ("1" | "2")
        Types.Double = Types.scalar({
            like: { test: function (v) { return v === "1" || v === "2"; } },
            isa: function (v) { return v === 1 || v === 2; },
            parse: parseInt
        });

        // Color = ("B" | "W")
        Types.Color = Types.scalar({
            like: { test: function (v) { return v === "B" || v === "W"; } }
        });

        // Text = { any character }
        Types.Text = Types.scalar({
            parse: function (value) {
                return value.
                    // remove soft linebreaks
                    replace( /\\(?:\n\r?|\r\n?)/g, "" ).
                    // convert white spaces other than linebreaks to space
                    replace( /[^\S\n\r]/g, " " ).
                    // insert escaped chars verbatim
                    replace( /\\([\S\s])/g, "$1" );
            },
            stringify: function (value) {
                return value.replace(/([\]\\:])/g, "\\$1"); // escape "]", "\" and ":"
            }
        });

        // SimpleText = { any character }
        Types.SimpleText = Types.scalar({
            parse: function (value) {
                return value.
                    // remove soft linebreaks
                    replace( /\\(?:\n\r?|\r\n?)/g, "" ).
                    // convert white spaces other than space to space even if it's escaped
                    replace( /\\?[^\S ]/g, " " ).
                    // insert escaped chars verbatim
                    replace( /\\([\S\s])/g, "$1" );
            },
            stringify: function (value) {
                return value.replace(/([\]\\:])/g, "\\$1"); // escape "]", "\" and ":"
            }
        });

        this.Types = Types;

        this.properties = function (t) {
            t = t || Types;

            return FF.properties(t, {
                identifiers: /^[A-Z]+$/,
                types: {
                    // Move properties
                    B  : t.Move,
                    KO : t.None,
                    MN : t.Number,
                    W  : t.Move,
                    // Setup properties
                    AB : t.listOfStone || t.listOf(t.Stone),
                    AE : t.listOfPoint,
                    AW : t.listOfStone || t.listOf(t.Stone),
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
                    AR : t.listOf( t.compose(t.Point, t.Point) ),
                    CR : t.listOfPoint,
                    DD : t.elistOfPoint,
                    LB : t.listOf( t.compose(t.Point, t.SimpleText) ),
                    LN : t.listOf( t.compose(t.Point, t.Point) ),
                    MA : t.listOfPoint,
                    SL : t.listOfPoint,
                    SQ : t.listOfPoint,
                    TR : t.listOfPoint,
                    // Root properties
                    AP : t.compose( t.SimpleText, t.SimpleText ),
                    CA : t.SimpleText,
                    FF : t.Number,
                    GM : t.Number,
                    ST : t.Number,
                    SZ : t.or( t.Number, t.compose(t.Number, t.Number) ),
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
                    FG : t.or( t.None, t.compose(t.Number, t.SimpleText) ),
                    PM : t.Number,
                    VM : t.elistOfPoint
                }
            });
        };

        return;
    });

    // Go (;FF[4]GM[1]) specific properties
    // http://www.red-bean.com/sgf/go.html
    SGFGrove.define(4, 1, function (FF) {
        var create = SGFGrove.Util.create;
        var Types = create(FF[4].Types);

        var expandPointList = (function () {
            var coord2char = "abcdefghijklmnopqrstuvwxyz";
                coord2char = (coord2char + coord2char.toUpperCase()).split("");

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

                if (x1 > x2) {
                    h = x1; x1 = x2; x2 = h;
                }

                if (y1 > y2) {
                    h = y1; y1 = y2; y2 = h;
                }

                for (y = y1; y <= y2; y++) {
                    for ( x = x1; x <= x2; x++ ) {
                        points.push( coord2char[x]+coord2char[y] );
                    }
                }

                return points;
            };
        }());

        Types.Point = Types.scalar({
            like: /^[a-zA-Z]{2}$/
        });
  
        Types.Stone = Types.Point;
        Types.Move  = Types.or(Types.None, Types.Point);

        Types.listOfPoint = (function (t) {
            var listOfPoint = t.listOf(t.or(
                t.Point,
                t.scalar({
                    like: /^[a-zA-Z]{2}:[a-zA-Z]{2}$/,
                    parse: function (value) {
                        var rect = value.split(":");
                        return expandPointList(rect[0], rect[1]);
                    }
                })
            ));

            var parse = listOfPoint.parse;
            var array = [];

            listOfPoint.parse = function (values) {
                var result = parse.call(this, values);
                return result && array.concat.apply(array, result); // flatten
            };

            return listOfPoint;
        }(Types));

        Types.elistOfPoint = Types.listOfPoint.toElist();
        Types.listOfStone  = Types.listOfPoint;
        Types.elistOfStone = Types.elistOfPoint;
    
        this.Types = Types;

        this.properties = function (t) {
            t = t || Types;

            var that = FF[4].properties(t);

            that.mergeTypes({
                HA : t.Number,
                KM : t.Real,
                TB : t.elistOfPoint,
                TW : t.elistOfPoint
            });

            return that;
        };

        return;
    });

}());

