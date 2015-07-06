/**
 * @overview SGFGrove.js
 * @author Ryo Anazawa
 * @version 1.0.1
 * @license MIT
 * @see http://www.red-bean.com/sgf/
 */
(function () {
    "use strict";

    var FF = {};

    var SGFGrove = {
        VERSION: "1.0.1"
    };

    SGFGrove.Util = (function () {
        var Util = {};

        Util.isNumber = function (value) {
            return typeof value === "number" && isFinite(value);
        };

        Util.isArray = Array.isArray || function (value) {
            return Object.prototype.toString.call(value) === "[object Array]";
        };

        Util.create = Object.create || function (prototype) {
            var Ctor = function () {};
            Ctor.prototype = prototype;
            return new Ctor();
        };

        Util.forEach = function (array, cb) {
            for ( var i = 0; i < array.length; i++ ) {
                cb(array[i], i);
            }
        };

        Util.traverse = function (gameTree, pre, post) {
            (function traverse (tree, i, parent) {
                if (pre) {
                    pre(tree, i, parent);
                }
                Util.forEach(tree[1], function (child, j) {
                    traverse(child, j, tree);
                });
                if (post) {
                    post(tree, i, parent);
                }
            }(gameTree, null, null));
        };

        return Util;
    }());

    FF.Types = (function () {
        var Types = {};
        var isArray = SGFGrove.Util.isArray;
        var isNumber = SGFGrove.Util.isNumber;

        Types.scalar = function () {
            var args = arguments[0] || {};

            var like = args.like || { test: function () { return true; } };
            var parse = args.parse || function (v) { return v; };

            var isa = args.isa || function (v) { return typeof v === "string" && like.test(v); };
            var stringify = args.stringify || String;

            var that = {
                name: args.name || ""
            };

            that.parse = function (values) {
                if ( values.length === 1 && like.test(values[0]) ) {
                    return parse( values[0] );
                }
            };

            that.stringify = function (value) {
                if ( isa(value) ) {
                    return [ stringify(value) ];
                }
            };

            return that;
        };

        // Number = ["+"|"-"] Digit {Digit}
        Types.Number = Types.scalar({
            name: "Number",
            like: /^[+-]?\d+$/,
            isa: function (v) { return isNumber(v) && Math.floor(v) === v; },
            parse: function (v) { return parseInt(v, 10); }
        });

        Types.Unknown = {
            name: "Unknown",
            parse: function (values) {
                var result = [];

                for ( var i = 0; i < values.length; i++ ) {
                    result[i] = values[i].replace(/\\\]/g, "]");
                }

                return result;
            },
            stringify: function (values) {
                var result = [];

                if ( !isArray(values) ) {
                    return;
                }

                for ( var i = 0; i < values.length; i++ ) {
                    if ( typeof values[i] === "string" ) {
                        result[i] = values[i].replace(/\]/g, "\\]");
                    }
                    else {
                        return;
                    }
                }

                return result;
            }
        };

        return Types;
    }());

    FF.properties = function (types) {
        var that = {
            types: {},
            defaultType: (types && types.Unknown) || FF.Types.Unknown
        };

        that.getType = function (ident) {
            return this.types[ident] || this.defaultType;
        };

        that.merge = function (other) {
            for ( var ident in other ) {
                if ( other.hasOwnProperty(ident) &&
                     typeof other[ident] === "object" ) {
                    this.types[ident] = other[ident];
                }
            }
            return this;
        };

        return that;
    };

    FF.createProperties = function (ff, gm) {
        if ( ff && FF.hasOwnProperty(ff) ) {
            if ( gm && FF[ff].hasOwnProperty(gm) ) {
                return FF[ff][gm].properties();
            }
            return FF[ff].properties();
        }
        return FF.properties();
    };

    SGFGrove.parse = (function () {
        var SGFNumber = FF.Types.Number;

        // Override RegExp's test and exec methods to let ^ behave like
        // the \G assertion (/\G.../gc). See also:
        // http://perldoc.perl.org/perlop.html#Regexp-Quote-Like-Operators
        
        var source, lastIndex;

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
        var parseGameTree = function (properties) {
            var sequence = [];
            var children = [], child;
            var node, ident, values, val, type;

            if ( !test.call(/^\s*\(\s*/g) ) { // start of GameTree
                return;
            }

            while ( test.call(/^;\s*/g) ) { // start of Node
                node = {};

                while ( ident = exec.call(/^([a-zA-Z0-9]+)\s*/g) ) { // PropIdent(-like)
                    ident = ident[1].replace(/[a-z]/g, ""); // for FF[3]
                    values = [];

                    if ( node.hasOwnProperty(ident) ) {
                        throw new SyntaxError("Property "+ident+" already exists");
                    }

                    while ( val = exec.call(/^\[((?:\\]|[^\]])*)\]\s*/g) ) { // PropValue
                        values.push( val[1] );
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

                        if ( values === undefined ) {
                            values = "["+node[ident].join("][")+"]";
                            throw new SyntaxError(type.name+" expected, got "+values);
                        }

                        node[ident] = values;
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
                throw new SyntaxError("Unexpected token "+source.charAt(lastIndex));
            }

            // (;a(;b(;c))) => (;a;b;c)
            if ( children.length === 1 ) {
                sequence = sequence.concat(children[0][0]);
                children = children[0][1];
            }

            return [ sequence, children ];
        };
        /* jshint boss:false */

        return function (text, reviver) {
            var collection = [], gameTree;

            source = String(text);
            lastIndex = 0;

            while ( gameTree = parseGameTree() ) { // jshint ignore:line
                collection.push( gameTree );
            }

            if ( lastIndex !== source.length ) {
                throw new SyntaxError("Unexpected token "+source.charAt(lastIndex));
            }

            // Copied and rearranged from json2.js so that we can pass the same
            // callback to both of SGF.parse and JSON.parse
            // https://github.com/douglascrockford/JSON-js/blob/master/json2.js
            if ( typeof reviver === "function" ) {
                collection = (function walk (holder, key) {
                    var k, v, value = holder[key];
                    if ( value && typeof value === "object" ) {
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
                }({ "": collection }, ""));
            }

            return collection;
        };
    }());

    SGFGrove.stringify = (function () {
        var Num = FF.Types.Number;
        var replacer, select;

        var isArray  = SGFGrove.Util.isArray;
        var isNumber = SGFGrove.Util.isNumber;

        /*
        var finalize = function (key, holder) {
            var value = holder[key];
            var i, k, v;

            if ( value && typeof value === "object" &&
                 typeof value.toSGF === "function" ) {
                value = value.toSGF();
            }

            if ( replacer ) {
                value = replacer.call( holder, key, value );
            }

            if ( !value || typeof value !== "object" ) {
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
        */

        return function (collection, rep, space) {
            var props, propIdents, id = 0;
            var indent = "", gap = "", lf;
            var i;

            select = undefined;
            replacer = undefined;

            if ( isArray(rep) ) {
                select = [];
                for ( i = 0; i < rep.length; i++ ) {
                    if ( typeof rep[i] === "string" ) {
                        select.push( rep[i] );
                    }
                }
            }
            else if ( typeof rep === "function" ) {
                replacer = rep;
            }
            else if ( rep ) {
                throw new Error("replacer must be array or function");
            }

            if ( isNumber(space) ) {
                for ( i = 0; i < space; i++ ) {
                    indent += " ";
                }
            }
            else if ( typeof space === "string" ) {
                indent = space;
            }

            lf = indent ? "\n" : "";
            //collection = finalize( "", { "": collection } );

            collection = (function finalize (key, holder) {
                var value = holder[key];
                var i, k, v;

                if ( value && typeof value === "object" &&
                     typeof value.toSGF === "function" ) {
                    value = value.toSGF();
                }

                if ( replacer ) {
                    value = replacer.call( holder, key, value );
                }

                if ( !value || typeof value !== "object" ) {
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
            }("", { "": collection }));

            return (function stringify (gameTrees) {
                //var isCollection = gameTrees === collection;
                var text = "", mind, prefix;
                var i, gameTree, sequence, root, ff, gm;
                var j, node, ident, values;

                //assert( isArray(gameTrees), isCollection ? "Collection" : "GameTrees" );
                
                if ( !isArray(gameTrees) ) {
                    return;
                }

                for ( i = 0; i < gameTrees.length; i++ ) {
                    gameTree = gameTrees[i];
                    //assert( isArray(gameTree), "GameTree" );

                    if ( !isArray(gameTree) ) {
                        continue;
                    }

                    sequence = gameTree[0];
                    //assert( isArray(sequence) && sequence.length, "Sequence" );

                    if ( !isArray(sequence) || !sequence.length ) {
                        continue;
                    }

                    //if ( isCollection ) {
                    if ( gameTrees === collection ) {
                        root = (typeof sequence[0] === "object" && sequence[0]) || {};
                        ff = root.hasOwnProperty("FF") ? Num.parse(Num.stringify(root.FF)) : 1;
                        gm = root.hasOwnProperty("GM") ? Num.parse(Num.stringify(root.GM)) : 1;
                        /*
                        try {
                            ff = root.hasOwnProperty("FF") ?
                                 Num.parse( Num.stringify(root.FF) ) : 1;
                            gm = root.hasOwnProperty("GM") ?
                                 Num.parse( Num.stringify(root.GM) ) : 1;
                        }
                        catch (error) {
                            error.message += " at FF/GM of node #"+id+", "+dump(root);
                            throw error;
                        }
                        */
                        propIdents = (ff && ff > 0) ? ff < 4 ? /^[A-Z][A-Z0-9]?$/ : /^[A-Z]+$/ : /^$/;
                        //props = FF.getProperties( ff, gm );
                        props = FF.createProperties( ff, gm );
                    }
 
                    text += gap + "(" + lf; // Open GameTree

                    mind = gap;
                    gap += indent;
                    for ( j = 0; j < sequence.length; j++, id++ ) {
                        node = sequence[j];
                        //assert( node && typeof node === "object", "Node" );
                        
                        if ( !node || typeof node !== "object" ) {
                            text += gap + ";" + lf;
                            continue;
                        }

                        prefix = gap + ";";
                        for ( ident in node ) {
                            if ( node.hasOwnProperty(ident) && propIdents.test(ident) ) {
                            /*
                                try {
                                    values = props.get(ident).stringify(node[ident]);
                                }
                                catch (error) {
                                    error.message += " at "+ident+" of node #"+id+", "+dump(node);
                                    throw error;
                                }
                                */
                                values = props.getType(ident).stringify(node[ident]);
                                if ( values !== undefined ) {
                                    text += prefix + ident + "[" + values.join("][") + "]" + lf;
                                    prefix = indent ? gap+" " : "";
                                }
                            }
                        }
                    }

                    text += stringify( gameTree[1] );
                    text += mind + ")" + lf; // close GameTree

                    gap = mind;
                }

                return text;
            }(collection));
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
        var Types = SGFGrove.Util.create( FF.Types );
        var isArray = SGFGrove.Util.isArray;
        var isNumber = SGFGrove.Util.isNumber;

        Types.compose = function (left, right) {
            return left && right && {
                name: "composed "+left.name+' ":" '+right.name,
                parse: function (values) {
                    if ( values.length === 1 ) {
                        var v = /^((?:\\:|[^:])*):([\s\S]*)$/.exec(values[0]);
                        if ( v ) {
                            var l = left.parse( [v[1]] );
                            var r = right.parse( [v[2]] );
                            if ( l !== undefined && r !== undefined ) {
                                return [l, r];
                            }
                        }
                    }
                },
                stringify: function (value) {
                    if ( isArray(value) && value.length === 2 ) {
                        var l = left.stringify(value[0])[0];
                        var r = right.stringify(value[1])[0];
                        if ( l !== undefined && r !== undefined ) {
                            return [l+":"+r];
                        }
                    }
                }
            };
        };

        Types.listOf = function (scalar, args) {
            var canBeEmpty = (args || {}).canBeEmpty;

            return scalar && {
                name: (canBeEmpty ? "elist of " : "list of ")+scalar.name,
                canBeEmpty: canBeEmpty,
                parse: function (values) {
                    var result = [];

                    if ( values.length === 1 && values[0] === "" ) {
                        return this.canBeEmpty ? result : undefined;
                    }

                    for ( var i = 0; i < values.length; i++ ) {
                        result[i] = scalar.parse([values[i]]);
                        if ( result[i] === undefined ) {
                            return;
                        }
                    }

                    return result;
                },
                stringify: function (values) {
                    var result = [""];

                    if ( !isArray(values) ) {
                        return;
                    }

                    if ( !values.length ) {
                        return this.canBeEmpty ? result : undefined;
                    }

                    for ( var i = 0; i < values.length; i++ ) {
                        result[i] = scalar.stringify(values[i])[0];
                        if ( result[i] === undefined ) {
                            return;
                        }
                    }

                    return result;
                }
            };
        };

        Types.elistOf = function (scalar) {
            return Types.listOf(scalar, {
                canBeEmpty: true
            });
        };

        // None = ""
        Types.None = Types.scalar({
            name: "None",
            like: { test: function (v) { return v === ""; } },
            isa: function (v) { return v === null; },
            parse: function () { return null; },
            stringify: function () { return ""; }
        });

        // Real = Number ["." Digit { Digit }]
        Types.Real = Types.scalar({
            name: "Real",
            like: /^[+-]?\d+(?:\.\d+)?$/,
            isa: isNumber,
            parse: parseFloat
        });

        // Double = ("1" | "2")
        Types.Double = Types.scalar({
            name: "Double",
            like: { test: function (v) { return v === "1" || v === "2"; } },
            isa: function (v) { return v === 1 || v === 2; },
            parse: parseInt
        });

        // Color = ("B" | "W")
        Types.Color = Types.scalar({
            name: "Color",
            like: { test: function (v) { return v === "B" || v === "W"; } }
        });

        // Text = { any character }
        Types.Text = Types.scalar({
            name: "Text",
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
            name: "SimpleText",
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

        Types.or = function (a, b) {
            return a && b && {
                name: "("+a.name+" | "+b.name+")",
                parse: function (values) {
                    var result = a.parse(values);
                    return result !== undefined ? result : b.parse(values);
                },
                stringify: function (value) {
                    var result = a.stringify(value);
                    return result !== undefined ? result : b.stringify(value);
                }
            };
        };

        this.Types = Types;

        this.properties = function (args) {
            var t = args || Types;

            return FF.properties(t).merge({
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
            });
        };

        return;
    });

    // Go (;FF[4]GM[1]) specific properties
    // http://www.red-bean.com/sgf/go.html
    SGFGrove.define(4, 1, function (FF) {
        var create = SGFGrove.Util.create;
        var Types = create( FF[4].Types );

        var expandPointList = (function () {
            var coord = "abcdefghijklmnopqrstuvwxyz";
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

                if ( p1 === p2 ) {
                    return;
                }

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
            name: "Point",
            like: /^[a-zA-Z]{2}$/
        });
  
        Types.Stone = create( Types.Point );
        Types.Stone.name = "Stone";

        Types.Move = Types.scalar({
            name: "Move",
            like: /^(?:[a-zA-Z]{2})?$/,
            isa: function (value) {
                return value === null ||
                       (typeof value === "string" && /^[a-zA-Z]{2}$/.test(value));
            },
            parse: function (v) { return v === "" ? null : v; },
            stringify: function (v) { return v === null ? "" : v; }
        });

        Types.listOfPoint = (function (t) {
            var listOfPoint = t.listOf(t.or(
                t.Point,
                t.scalar({
                    name: 'composed Point ":" Point',
                    like: /^[a-zA-Z]{2}:[a-zA-Z]{2}$/,
                    parse: function (v) { return expandPointList.apply(null, v.split(":")); }
                })
            ));

            var parse = listOfPoint.parse;
            var array = [];
                    
            listOfPoint.parse = function (values) {
                var result = parse.call(this, values);
                return result && array.concat.apply(array, result);
            };

            return listOfPoint;
        }(Types));

        Types.elistOfPoint = create( Types.listOfPoint );
        Types.elistOfPoint.name = "elist of Point";
        Types.elistOfPoint.canBeEmpty = true;

        Types.listOfStone = create( Types.listOfPoint );
        Types.listOfStone.name = "list of Stone";

        Types.elistOfStone = create( Types.elistOfPoint );
        Types.elistOfStone.name = "elist of Stone";
    
        this.Types = Types;

        this.properties = function (args) {
            var t = args || Types;

            return FF[4].properties(t).merge({
                HA : t.Number,
                KM : t.Real,
                TB : t.elistOfPoint,
                TW : t.elistOfPoint
            });
        };

        return;
    });

    if ( typeof exports !== "undefined" ) {
        module.exports = SGFGrove; // jshint ignore:line
    }
    else {
        window.SGFGrove = SGFGrove;
    }

}());

