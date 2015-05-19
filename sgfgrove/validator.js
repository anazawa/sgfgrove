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

        that.createError = function (context, error) {
            var c = {};
            var key;

            if ( !error.hasOwnProperty("context") ) {
                for ( key in context ) {
                    if ( context.hasOwnProperty(key) ) {
                        c[key] = context[key];
                    }
                }
                error.context = c;
            }

            return error;
        };

        that.clearErrors = function () {
            this.errors.length = 0;
        };

        that.addErrors = function (context, errors) {
            errors = errors || [];
            for ( var i = 0; i < errors.length; i++ ) {
                this.errors.push( this.createError(context, errors[i]) );
            }
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
                        this.addErrors( context, body.apply(rule, args) );
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
                node       : null,
                nodeId     : null,
                propIdent  : null,
                propValue  : null
            };

            this.clearErrors();
            this.applyRules(ff, gm, "validateCollection", [context, collection]);

            (function validate (gameTrees) {
                var i, gameTree, sequence;
                var j, node, id;

                for ( i = 0; i < gameTrees.length; i++ ) {
                    gameTree = gameTrees[i];
                    sequence = gameTree[0];

                    context.node      = null;
                    context.nodeId    = null;
                    context.propIdent = null;
                    context.propValue = null;

                    if ( gameTrees === collection ) {
                        ff = sequence[0].FF || 1;
                        gm = sequence[0].GM || 1;
                        context.gameTree = gameTree;
                        context.gameTreeId = i;
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

                    for ( j = sequence.length-1; j >= 0; j++ ) {
                        node = sequence[j];
                        context.node = node;
                        context.nodeId = id--;
                        that.applyRules(ff, gm, "revalidateNode", [context, node]);
                    }
                }
            }(collection));

            return !this.errors.length;
        };

        that.init.apply(that, arguments);

        return that;
    };

    SGFGrove.validator.rule = function () {
        return {};
    };

    SGFGrove.validator.rule.root = function () {
        var that = SGFGrove.validator.rule();

        that.validateCollection = function (c) {
            c.root = null;
        };

        that.validateGameTree = function (c, gameTree) {
            c.root = gameTree[0][0];
        };

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
                    errors.push( error.rootPropNotInRootNode(propIdent) );
                }

                return errors;
            };
        }());

        return that;
    };

    SGFGrove.validator.rule.gameInfo = function () {
        var that = SGFGrove.validator.rule();

        var makeValidateNode = function (gameInfoProps) {
            var isGameInfoProp = {};
            var error = SGFGrove.validator.error;

            for ( var i = 0; i < gameInfoProps.length; i++ ) {
                isGameInfoProp[gameInfoProps[i]] = null;
            }

            return function (c, node) {
                var errors = [];
            
                for ( var propIndet in node ) {
                    if ( node.hasOwnProperty(propIdent) && isGameInfoProp.hasOwnProperty(propIdent) ) {
                        if ( !c.gameInfo ) {
                            c.gameInfo = node;
                            break;
                        }
                        errors.push( error.gameInfoAlreadySet(propIdent) );
                    }
                }

                return errors;
            };
        };

        that.validateCollection = function (c) {
            c.gameInfo = null;
        };

        that.FF4_validateNode = makeValidateNode([
            "AN", "BR", "BT", "CP", "DT", "EV", "GN",
            "GC", "ON", "OT", "PB", "PC", "PW", "RE",
            "RO", "RU", "SO", "TM", "US", "WR", "WT"
        ]);

        that.FF4_GM1_validateNode = makeValidateNode([
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
        var that = SGFGrove.validator.rule();

        that.FF4_validateNode = (function () {
            var error = SGFGrove.validator.error;
            var isMoveProp = { B: null, KO: null, MN: null, W: null };
            var isSetupProp = { AB: null, AE: null, AW: null, PL: null };

            return function (c, node) {
                var errors = [];
                var hasSetupProp = false;
                var hasMoveProp = false;

                for ( var propIdent in node ) {
                    if ( node.hasOwnProperty(propIdent) ) {
                        if ( isSetupProp.hasOwnProperty(propIdent) ) {
                            hasSetupProp = true;
                        }
                        else if ( isMoveProp.hasOwnProperty(propIdent) ) {
                            hasMoveProp = true;
                        }
                        if ( hasSetupProp && hasMoveProp ) {
                            errors.push( error.moveSetupMixed() );
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
        var that = SGFGrove.validator.rule();
        var error = SGFGrove.validator.error;

        that.FF4_validateNode = function (c, node) {
            var errors = [];

            if ( node.hasOwnProperty("B") && node.hasOwnProperty("W") ) {
                errors.push( error.twoMovesInNode() );
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.error = function (args) {
        var spec = args || {};

        var that = {
            name    : spec.name    || "Error",
            message : spec.message || "",
            context : spec.context
        };

        that.toString = function () {
            return this.message ? this.name+": "+this.message : this.name;
        };

        return that; 
    };

    SGFGrove.validator.error.rootPropNotInRootNode = function (propIdent) {
        return SGFGrove.validator.error({
            name: "RootPropNotInRootNode",
            message: "root property "+propIdent+" outside root node"
        });
    };

    SGFGrove.validator.error.gameInfoAlreadySet = function (propIdent) {
        return SGFGrove.validator.error({
            name: "GameInfoAlreadySet",
            message: "game-info property "+propIdent+" outside game-info node"
        });
    };

    SGFGrove.validator.error.moveSetupMixed = function () {
        return SGFGrove.validator.error({
            name: "MoveSetupMixed",
            message: "setup and move properties mixed within a node"
        });
    };

    SGFGrove.validator.error.twoMovesInNode = function () {
        return SGFGrove.validator.error({
            name: "TwoMovesInNode",
            message: "black and white move within a node"
        });
    };

}());
