(function () {
    "use strict";

    var SGFGrove = (function () {
        if ( typeof exports !== "undefined" ) {
            return require("../sgfgrove.js"); // jshint ignore:line
        }
        else {
            return window.SGFGrove;
        }
    }());

    var contains = function (array, item) {
        for ( var i = 0; i < array.length; i++ ) {
            if ( array[i] === item ) {
                return true;
            }
        }
        return false;
    };

    var isUnique = function (array) {
        var seen = {};

        for ( var i = 0; i < array.length; i++ ) {
            if ( seen.hasOwnProperty(array[i]) ) {
                return false;
            }
            seen[array[i]] = null;
        }

        return true;
    };

    var isMixed = function (object, keys) {
        var seen = false;

        for ( var i = 0; i < keys.length; i++ ) {
            if ( object.hasOwnProperty(keys[i]) ) {
                if ( seen ) {
                    return true;
                }
                seen = true;
            }
        }

        return false;
    };

    var map = function (array, cb) {
        var result = [];

        for ( var i = 0; i < array.length; i++ ) {
            result[i] = cb(array[i], i, array);
        }

        return result;
    };

    var find = function (array, cb) {
        for ( var i = 0; i < array.length; i++ ) {
            if ( cb(array[i], i, array) ) {
                return array[i];
            }
        }
    };

    SGFGrove.validator = function () {
        var that = {};

        that.init = function (args) {
            var rules = (args && args.rules) || [];

            this.rules = [];

            for ( var i = 0; i < rules.length; i++ ) {
                this.addRule(rules[i]);
            }

            return;
        };

        that.addRule = function (rule) {
            if ( rule && typeof rule === "object" ) {
                this.rules.push( rule );
            }
            else if ( typeof rule === "string" ) {
                this.rules.push( SGFGrove.validator.rule[rule]() );
            }
        };

        that.findRule = function (name) {
            var rules = this.rules;

            for ( var i = 0; i < rules.length; i++ ) {
                if ( rules[i].name === name ) {
                    return rules[i];
                }
            }

            return;
        };

        that.createError = function (error) {
            return error;
        };

        that.applyRules = function (ff, gm, to, args) {
            var rules = this.rules;
            var errors = [];
            var i, rule;
            var j, method;
            var k, result;

            var methods;
            if ( ff && gm ) {
                methods = [
                    "FF"+ff+"_GM"+gm+"_"+to,
                    "FF"+ff+"_"+to,
                    to
                ];
            }
            else {
                methods = [ to ];
            }

            for ( i = 0; i < rules.length; i++ ) {
                rule = rules[i];
                for ( j = 0; j < methods.length; j++ ) {
                    method = rule[methods[j]];
                    if ( typeof method === "function" ) {
                        result = method.apply(rule, args) || [];
                        for ( k = 0; k < result.length; k++ ) {
                            errors.push( this.createError(result[k]) );
                        }
                        break;
                    }
                }
            }

            return errors;
        };

        that.validate = function (collection, errorHandlers) {
            var that = this;
            var errors = [];
            var nodeId = 0;
            var i, error, handler;

            var context = {
                collection : collection,
                gameTree   : null,
                gameTreeId : null,
                root       : null,
                node       : null,
                nodeId     : null,
                propIdent  : null,
                propValue  : null
            };

            var applyRules = function (to, args) {
                var ff = context.root ? context.root.FF || 1 : null;
                var gm = context.root ? context.root.GM || 1 : null;
                var e = that.applyRules( ff, gm, to, [context].cocat(args) );
                for ( var i = 0; i < e.length; i++ ) {
                    errors.push( e[i] );
                }
            };

            applyRules("validateCollection", [collection]);
            
            (function validate (gameTrees) {
                var i, gameTree, sequence;
                var j, node, propIdent, propValue, id;

                for ( i = 0; i < gameTrees.length; i++ ) {
                    gameTree = gameTrees[i];
                    sequence = gameTree[0];

                    context.node      = null;
                    context.nodeId    = null;
                    context.propIdent = null;
                    context.propValue = null;

                    if ( gameTrees === collection ) {
                        nodeId = 0;
                        context.gameTree = gameTree;
                        context.gameTreeId = i;
                        context.root = sequence[0];
                        applyRules("validateGameTree", [gameTree]);
                    }

                    for ( j = 0; j < sequence.length; j++ ) {
                        node = sequence[i];
                        context.node = node;
                        context.nodeId = nodeId++;
                        applyRules("validateNode", [node]);

                        for ( propIdent in node ) {
                            if ( node.hasOwnProperty(propIdent) ) {
                                propValue = node[propIdent];
                                context.propIdent = propIdent;
                                context.porpValue = propValue;
                                applyRules("validateProperty", [propIdent, propValue]);
                            }
                        }
                    }

                    id = nodeId;
                    validate(gameTree[1]);

                    context.propIdent = null;
                    context.propValue = null;

                    for ( j = sequence.length-1; j >= 0; j-- ) {
                        node = sequence[j];
                        context.node = node;
                        context.nodeId = --id;
                        applyRules("revalidateNode", [node]);
                    }
                }
            }(collection));

            if ( errorHandlers && typeof errorHandlers === "object" ) {
                for ( i = 0; i < errors.length; i++ ) {
                    error = errors[i];
                    handler = errorHandlers["on"+error.name];
                    if ( typeof handler === "function" ) {
                        handler.call(error.context, error);
                    }
                }
            }

            return errors;
        };

        that.init.apply(that, arguments);

        return that;
    };

    SGFGrove.validator.rule = function (name) {
        var that = {
            name: name || ""
        };

        return that;
    };

    SGFGrove.validator.rule.root = function () {
        var that = SGFGrove.validator.rule("root");
        var error = SGFGrove.validator.error;

        that.FF4_rootProps = ["AP", "CA", "FF", "GM", "ST", "SZ"];

        that.FF4_validateProperty = function (c, propIdent, propValue) {
            var errors = [];

            if ( c.node !== c.root && contains(this.FF4_rootProps, propIdent) ) {
                errors.push( error.rootPropNotInRootNodeError(c, propIdent) );
            }

            if ( propIdent === "ST" && !this.FF4_checkStyle(c, propValue) ) {
                errors.push( error.invalidFormat(c, propIdent) );
            }
            else if ( propIdent === "SZ" && !this.FF4_checkBoardSize(c, propValue) ) {
                errors.push( error.invalidFormat(c, propIdent) );
            }

            return errors;
        };

        that.FF4_GM1_validateProperty = function (c, propIdent, propValue) {
            var errors = [];

            if ( c.node !== c.root && contains(this.FF4_rootProps, propIdent) ) {
                errors.push( error.rootPropNotInRootNodeError(c, propIdent) );
            }

            if ( propIdent === "ST" && !this.FF4_checkStyle(c, propValue) ) {
                errors.push( error.invalidFormat(c, propIdent) );
            }
            else if ( propIdent === "SZ" && !this.FF4_GM1_checkBoardSize(c, propValue) ) {
                errors.push( error.invalidFormat(c, propIdent) );
            }

            return errors;
        };

        that.FF4_checkStyle = function (c, style) {
            return style >= 0 && style <= 3;
        };

        that.FF4_checkBoardSize = function (c, size) {
            if ( SGFGrove.Util.isArray(size) ) {
                if ( size[0] === size[1] ) {
                    return false;
                }
                return size[0] >= 1 && size[1] >= 1;
            }
            return size >= 1;
        };

        that.FF4_GM1_checkBoardSize = function (c, size) {
            if ( this.FF4_checkBoardSize(c, size) ) {
                if ( SGFGrove.Util.isArray(size) ) {
                    return size[0] <= 52 && size[1] <= 52;
                }
                return size <= 52;
            }
            return false;
        };

        return that;
    };

    SGFGrove.validator.rule.gameInfo = function () {
        var that = SGFGrove.validator.rule("gameInfo");
        var error = SGFGrove.validator.error;

        that.FF4_gameInfoProps = [
            "AN", "BR", "BT", "CP", "DT", "EV", "GN",
            "GC", "ON", "OT", "PB", "PC", "PW", "RE",
            "RO", "RU", "SO", "TM", "US", "WR", "WT"
        ];

        that.FF4_GM1_gameInfoProps = [ "HA", "KM" ];

        that.validateCollection = function (c) {
            c.gameInfo = null;
        };

        that.FF4_validateProperty = function (c, propIdent, propValue) {
            var errors = [];
            
            if ( contains(this.FF4_gameInfoProps, propIdent) ) {
                if ( !c.gameInfo ) {
                    c.gameInfo = c.node;
                }
                else if ( c.node !== c.gameInfo ) {
                    errors.push( error.gameInfoAlreadySetError(c, propIdent) );
                }
            }

            if ( propIdent === "RE" && !this.FF4_checkResult(propValue) ) {
                errors.push( error.invalidFormatError(c, propIdent) );
            }
            else if ( propIdent === "DT" && !this.FF4_checkDate(propValue) ) {
                errors.push( error.invalidFormatError(c, propIdent) );
            }

            return errors;
        };

        that.FF4_GM1_validateProperty = function (c, propIdent, propValue) {
            var errors = this.FF4_validateProperty(c, propIdent, propValue);

            if ( contains(this.FF4_GM1_gameInfoProps, propIdent) ) {
                if ( !c.gameInfo ) {
                    c.gameInfo = c.node;
                }
                else if ( c.node !== c.gameInfo ) {
                    errors.push( error.gameInfoAlreadySetError(c, propIdent) );
                }
            }

            if ( propIdent === "HA" && !this.FF4_GM1_checkHandicap(propValue) ) {
                errors.push( error.invalidFormatError(c, propIdent) );
            }

            return errors;
        };

        that.FF4_revalidateNode = function (c, node) {
            if ( node === c.gameInfo ) {
                c.gameInfo = null;
            }
        };

        that.FF4_checkDate = function (c, date) {
            return /^\d{4}(?:-\d\d){0,2}(?:,\d{4}(?:-\d\d){0,2})*$/.test(date);
        };

        that.FF4_checkResult = function (c, result) {
            return result === "0"    ||
                   result === "Draw" ||
                   result === "Void" ||
                   result === "?"    ||
                   /^[B|W]\+(?:\d+(?:\.\d+)?|R|Resign|T|Time|F|Forfeit)?$/.test(result);
        };

        that.FF4_GM1_checkHandicap = function (c, handicap) {
            return handicap >= 2;
        };

        return that;
    };

    SGFGrove.validator.rule.moveSetup = function () {
        var that = SGFGrove.validator.rule("moveSetup");
        var error = SGFGrove.validator.error;

        that.FF4_moveProps = ["B", "KO", "MN", "W"];
        that.FF4_setupProps = ["AB", "AE", "AW", "PL"];

        that.FF4_validateNode = function (c, node) {
            var errors = [];
            var hasSetupProp = false;
            var hasMoveProp = false;

            for ( var propIdent in node ) {
                if ( node.hasOwnProperty(propIdent) ) {
                    if ( contains(this.FF4_moveProps, propIdent) ) {
                        hasSetupProp = true;
                    }
                    else if ( contains(this.FF4_setupProps, propIdent) ) {
                        hasMoveProp = true;
                    }
                    if ( hasSetupProp && hasMoveProp ) {
                        errors.push( error.moveSetupMixedError(c) );
                        break;
                    }
                }
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.move = function () {
        var that = SGFGrove.validator.rule("move");
        var error = SGFGrove.validator.error;

        that.FF4_validateNode = function (c, node) {
            var errors = [];
            var hasBlackMove = node.hasOwnProperty("B");
            var hasWhiteMove = node.hasOwnProperty("W");

            if ( hasBlackMove && hasWhiteMove ) {
                errors.push( error.twoMovesInNodeError(c) );
            }

            if ( node.hasOwnProperty("KO") && !hasBlackMove && !hasWhiteMove ) {
                errors.push( error.annotateWithoutMoveError(c, "KO") );
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.setup = function () {
        var that = SGFGrove.validator.rule("setup");
        var error = SGFGrove.validator.error;

        that.FF4_validateNode = function (c, node) {
            var errors = [];

            if ( !isUnique((node.AB||[]).concat(node.AW||[], node.AE||[])) ) {
                errors.push( error.positionNotUniqueError(c, ["AB", "AW", "AE"]) );
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.nodeAnnotation = function () {
        var that = SGFGrove.validator.rule("nodeAnnotation");
        var error = SGFGrove.validator.error;

        that.FF4_validateNode = function (c, node) {
            var props = ["DM", "UC", "GB", "GW"];
            var errors = [];

            if ( isMixed(node, props) ) {
                errors.push( error.annotateNotUniqueError(c, props) );
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.moveAnnotation = function () {
        var that = SGFGrove.validator.rule("moveAnnotation");
        var error = SGFGrove.validator.error;

        that.FF4_validateNode = function (c, node) {
            var props = ["BM", "DO", "IT", "TE"];
            var errors = [];

            if ( isMixed(node, props) ) {
                errors.push( error.annotateNotUniqueError(c, props) );
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.markup = function () {
        var that = SGFGrove.validator.rule("markup");
        var error = SGFGrove.validator.error;
        var first = function (array) { return array[0]; };
        var isZeroLength = function (line) { return line[0] === line[1]; };
        var toString = function (line) { return line[0]+line[1]; };

        that.FF4_validateNode = function (c, node) {
            var errors = [];
            var CR = node.CR || [];
            var MA = node.MA || [];
            var SL = node.SL || [];
            var SQ = node.SQ || [];
            var TR = node.TR || [];

            if ( !isUnique(CR.concat(MA, SL, SQ, TR)) ) {
                errors.push( error.positionNotUniqueError(c, ["CR", "MA", "SL", "SQ", "TR"]) );
            }

            return errors;
        };

        that.FF4_validateProperty = function (c, propIdent, propValue) {
            var errors = [];

            if ( propIdent === "LB" && !isUnique(map(propValue, first)) ) {
                errors.push( error.positionNotUniqueError(c, ["LB"]) );
            }
            else if ( propIdent === "LN" || propIdent === "AR" ) {
                if ( find(propValue, isZeroLength) ) {
                    errors.push( error.zeroLengthLineError(c, propIdent) );
                }
                if ( !isUnique(map(propValue, toString)) ) {
                    errors.push( error.lineNotUniqueError(c, propIdent) );
                }
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.misc = function () {
        var that = SGFGrove.validator.rule("misc");
        var error = SGFGrove.validator.error;

        that.FF4_GM1_validateProperty = function (c, propIdent, propValue) {
            var errors = [];

            if ( (propIdent === "TB" || propIdent === "TW") && !isUnique(propValue) ) {
                errors.push( error.positionNotUniqueError(c, [propIdent]) );
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.error = function (c, args) {
        var spec = args || {};

        var that = {
            name    : spec.name    || "Error",
            message : spec.message || ""
        };

        that.context = (function () {
            var context = spec.context;
            var copy = null;
            var key;

            if ( context && typeof context === "object" ) {
                copy = {};
                for ( key in context ) {
                    if ( context.hasOwnProperty(key) ) {
                        copy[key] = context[key];
                    }
                }
            }

            return copy;
        }());
 
        that.toString = function () {
            return this.message ? this.name+": "+this.message : this.name;
        };

        return that; 
    };

    SGFGrove.validator.error.rootPropNotInRootNodeError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "RootPropNotInRootNodeError",
            message: "root property "+propIdent+" outside root node"
        });
    };

    SGFGrove.validator.error.gameInfoAlreadySetError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "GameInfoAlreadySetError",
            message: "game-info property "+propIdent+" outside game-info node"
        });
    };

    SGFGrove.validator.error.moveSetupMixedError = function (c) {
        return SGFGrove.validator.error(c, {
            name: "MoveSetupMixedError",
            message: "setup and move properties mixed within a node"
        });
    };

    SGFGrove.validator.error.twoMovesInNodeError = function (c) {
        return SGFGrove.validator.error(c, {
            name: "TwoMovesInNodeError",
            message: "black and white moves within a node"
        });
    };

    SGFGrove.validator.error.annotateWithoutMoveError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "AnnotateWithoutMoveError",
            message: "move annotation '"+propIdent+"' without a move in node"
        });
    };

    SGFGrove.validator.error.positionNotUniqueError = function (c, props) {
        return SGFGrove.validator.error(c, {
            name: "PositionNotUniqueError",
            message: props.join(", ")+" must have unique points"
        });
    };

    SGFGrove.validator.error.annotateNotUnique = function (c, props) {
        return SGFGrove.validator.error(c, {
            name: "AnnotateNotUniqueError",
            message: props.join(", ")+" must not be mixed within a single node"
        });
    };

    SGFGrove.validator.error.lineNotUniqueError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "LineNotUniqueError",
            message: propIdent+" must have unique lines"
        });
    };

    SGFGrove.validator.error.zeroLengthLineError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "ZeroLengthLineError",
            message: propIdent+" contains a zero-length line"
        });
    };

    SGFGrove.validator.error.invalidFromatError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "InvalidFormatError",
            message: "Invalid "+propIdent+" format"
        });
    };


}());

