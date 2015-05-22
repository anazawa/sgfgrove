(function () {
    "use strict";

    var SGFGrove;

    if ( typeof exports !== "undefined" ) {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
    }
    else {
        SGFGrove = window.SGFGrove;
    }

    SGFGrove.validator = function () {
        var that = {};

        that.create = function () {
            var that = SGFGrove.Util.create(this);
            that.init.apply(that, arguments);
            return that;
        };

        that.init = function (args) {
            var rules = (args && args.rules) || [];

            this.errors = [];
            this.rules  = [];

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

        that.clearErrors = function () {
            this.errors.length = 0;
        };

        that.addErrors = function (errors) {
            errors = errors || [];
            for ( var i = 0; i < errors.length; i++ ) {
                this.errors.push( this.createError(errors[i]) );
            }
        };

        that.handleErrors = function () {
            var errors = this.errors;
            var i, cb;

            for ( i = 0; i < errors.length; i++ ) {
                cb = this["on"+errors[i].name];
                if ( typeof cb === "function" ) {
                    cb(errors[i].context);
                }
            }

            return;
        };

        that.applyRules = function (ff, gm, default_, args) {
            var rules = this.rules;
            var i, rule;
            var j, method, body;

            var methods = [
                "FF"+ff+"_GM"+gm+"_"+default_,
                "FF"+ff+"_"+default_,
                default_
            ];

            for ( i = 0; i < rules.length; i++ ) {
                rule = rules[i];
                for ( j = 0; j < methods.length; j++ ) {
                    method = methods[j];
                    body = rule[method];
                    if ( typeof body === "function" ) {
                        this.addErrors( body.apply(rule, args) );
                        break;
                    }
                }
            }

            return;
        };

        that.validate = function (collection) {
            var that = this;
            var nodeId = 0;
            var ff, gm;

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

            this.clearErrors();
            this.applyRules(ff, gm, "validateCollection", [context, collection]);

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
                        ff = sequence[0].FF || 1;
                        gm = sequence[0].GM || 1;
                        context.gameTree = gameTree;
                        context.gameTreeId = i;
                        context.root = sequence[0];
                        that.applyRules(ff, gm, "validateGameTree", [context, gameTree]);
                    }

                    for ( j = 0; j < sequence.length; j++ ) {
                        node = sequence[i];
                        context.node = node;
                        context.nodeId = nodeId++;
                        that.applyRules(ff, gm, "validateNode", [context, node]);

                        for ( propIdent in node ) {
                            if ( node.hasOwnProperty(propIdent) ) {
                                propValue = node[propIdent];
                                context.propIdent = propIdent;
                                context.porpValue = propValue;
                                that.applyRules(ff, gm, "validateProperty", [context, propIdent, propValue]);
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
                        that.applyRules(ff, gm, "revalidateNode", [context, node]);
                    }
                }
            }(collection));

            this.handleErrors();

            return !this.errors.length;
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

        that.FF4_validateProperty = (function () {
            var error = SGFGrove.validator.error;
            var rootProps = ["AP", "CA", "FF", "GM", "ST", "SZ"];
            var isRootProp = {};

            for ( var i = 0; i < rootProps.length; i++ ) {
                isRootProp[rootProps[i]] = null;
            }

            return function (c, propIdent) {
                var errors = [];

                if ( c.node !== c.root && isRootProp.hasOwnProperty(propIdent) ) {
                    errors.push( error.rootPropNotInRootNodeError(c, propIdent) );
                }

                return errors;
            };
        }());

        return that;
    };

    SGFGrove.validator.rule.gameInfo = function () {
        var that = SGFGrove.validator.rule("gameInfo");

        var makeValidateNodeMethod = function (gameInfoProps) {
            var isGameInfoProp = {};
            var error = SGFGrove.validator.error;

            for ( var i = 0; i < gameInfoProps.length; i++ ) {
                isGameInfoProp[gameInfoProps[i]] = null;
            }

            return function (c, propIdent) {
                var errors = [];
            
                if ( isGameInfoProp.hasOwnProperty(propIdent) ) {
                    if ( !c.gameInfo ) {
                        c.gameInfo = c.node;
                    }
                    else if ( c.node !== c.gameInfo ) {
                        errors.push( error.gameInfoAlreadySetError(c, propIdent) );
                    }
                }

                return errors;
            };
        };

        that.validateCollection = function (c) {
            c.gameInfo = null;
        };

        that.FF4_validateProperty = makeValidateNodeMethod([
            "AN", "BR", "BT", "CP", "DT", "EV", "GN",
            "GC", "ON", "OT", "PB", "PC", "PW", "RE",
            "RO", "RU", "SO", "TM", "US", "WR", "WT"
        ]);

        that.FF4_GM1_validateProperty = makeValidateNodeMethod([
            "AN", "BR", "BT", "CP", "DT", "EV", "GN",
            "GC", "ON", "OT", "PB", "PC", "PW", "RE",
            "RO", "RU", "SO", "TM", "US", "WR", "WT",
            "HA", "KM"
        ]);

        that.FF4_revalidateNode = function (c, node) {
            if ( node === c.gameInfo ) {
                c.gameInfo = null;
            }
        };

        return that;
    };

    SGFGrove.validator.rule.moveSetup = function () {
        var that = SGFGrove.validator.rule("moveSetup");

        that.FF4_validateNode = (function () {
            var error = SGFGrove.validator.error;
            var isMoveProp = { B: null, KO: null, MN: null, W: null };
            var isSetupProp = { AB: null, AE: null, AW: null, PL: null };

            return function (c, node) {
                var errors = [];
                var hasSetupProp = false;
                var hasMoveProp = false;
                var propIdent;

                for ( propIdent in node ) {
                    if ( node.hasOwnProperty(propIdent) ) {
                        if ( isSetupProp.hasOwnProperty(propIdent) ) {
                            hasSetupProp = true;
                        }
                        else if ( isMoveProp.hasOwnProperty(propIdent) ) {
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
        }());

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

        that.FF4_validateProperty = function (c, propIdent, propValue) {
            var errors = [];
            var seen = {};
            var i;

            if ( propIdent === "AB" || propIdent === "AE" || propIdent === "AW" ) {
                for ( i = 0; i < propValue.length; i++ ) {
                    if ( seen.hasOwnProperty(propValue[i]) ) {
                        errors.push( error.positionNotUniqueError(c, propIdent) );
                        break;
                    }
                    seen[propValue[i]] = null;
                }
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.nodeAnnotation = function () {
        var that = SGFGrove.validator.rule("nodeAnnotation");
        var error = SGFGrove.validator.error;

        that.FF4_validateNode = (function () {
            var props = ["DM", "UC", "GB", "GW"];

            return function (c, node) {
                var errors = [];
                var seen = false;
                var i;

                for ( i = 0; i < props.length; i++ ) {
                    if ( node.hasOwnProperty(props[i]) ) {
                        if ( seen ) {
                            errors.push( error.annotateNotUniqueError(c, props[i]) );
                            break;
                        }
                        seen = true;
                    }
                }

                return errors;
            };
        }());

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

    SGFGrove.validator.error.positionNotUniqueError = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "PositionNotUniqueError",
            message: "'"+propIdent+"' position not unique"
        });
    };

    SGFGrove.validator.error.annotateNotUnique = function (c, propIdent) {
        return SGFGrove.validator.error(c, {
            name: "AnnotateNotUniqueError",
            message: "annotation property '"+propIdent+"' contradicts previous property"
        });
    };

}());
