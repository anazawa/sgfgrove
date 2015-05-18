(function () {
    "use strict";

    var SGFGrove;

    if ( typeof exports !== "undefined" ) {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
    }
    else {
        SGFGrove = window.SGFGrove;
    }

    var ucfirst = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    SGFGrove.validator = function () {
        var that = {};

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

        that.applyRules = function (ff, gm, name, args) {
            var methods = [ name ];
            var rules = this.rules;
            var i, rule;
            var j, method, body;

            if ( ff && gm ) {
                methods.push( "FF"+ff+"_"+methods[0] );
                methods.push( "FF"+ff+"_GM"+gm+"_"+methods[0] );
            }

            for ( i = 0; i < rules.length; i++ ) {
                rule = rules[i];
                for ( j = 0; j < methods.length; j++ ) {
                    method = methods[j];
                    body = rule[method];
                    if ( typeof body === "function" ) {
                        this.addErrors( context, body.apply(rule, args) );
                    }
                }
            }

            return;
        };

        that.validate = function (collection) {
            var that = this;
            var gameTreeId = 0;
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
                var i, gameTree, sequence, treeId;
                var j, node, id;

                for ( i = 0; i < gameTrees.length; i++ ) {
                    gameTree = gameTrees[i];
                    sequence = gameTree[0];

                    if ( gameTrees === collection ) {
                        ff = sequence[0].FF || 1;
                        gm = sequence[0].GM || 1;
                    }

                    context.gameTree   = gameTree;
                    context.gameTreeId = gameTreeId++;
                    context.node       = null;
                    context.nodeId     = null;
                    context.propIdent  = null;
                    context.propValue  = null;

                    that.applyRules(ff, gm, "validateGameTree", [context, gameTree]);

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
                    treeId = gameTreeId;
                    validate(gameTree[1]);

                    context.gameTree   = gameTree;
                    context.gameTreeId = treeId;
                    context.propIdent  = null;
                    context.propValue  = null;

                    for ( j = sequence.length-1; j >= 0; j++ ) {
                        node = sequence[j];
                        context.node = node;
                        context.nodeId = id--;
                        that.applyRules(ff, gm, "revalidateNode", [context, node]);
                    }

                    that.applyRules(ff, gm, "revalidateGameTree", [context, gameTree]);
                }
            }(collection));

            return !this.errors.length;
        };

        return that;
    };

    SGFGrove.validator.rule.root = function () {
        var that = {};

        that.isRootProperty = (function () {
            var rootProps = ["AP", "CA", "FF", "GM", "ST", "SZ"];
            var isRootProp = {};

            for ( var i = 0; i < rootProps.length; i++ ) {
                isRootProp[rootProp[i]] = null;
            }

            return function (prop) {
                return isRootProp.hasOwnProperty(prop);
            };
        }());

        that.validateCollection = function (c) {
            c.root = null;
        };

        that.validateGameTree = function (c, gameTree) {
            var collection = c.collection;
            for ( var i = 0; i < collection.length; i++ ) {
                if ( gameTree === collection[i] ) {
                    c.root = gameTree[0][0];
                    break;
                }
            }
        };

        that.FF4_validateProperty = function (c, propIdent) {
            var errors = [];

            if ( c.node !== c.root && this.isRootProperty(propIdent) ) {
                errors.push({
                    name: "RootPropNotInRootNode",
                    message: "root property "+propIdent+" outside root node"
                });
            }

            return errors;
        };

        return that;
    };

    SGFGrove.validator.rule.gameInfo = function () {
        var that = {};

        that.isGameInfoProperty = (function () {
            var gameInfoProps = ["AN", "BR", "BT", "CP", "DT", "EV", "GN", "GC", "ON", "OT", "PB", "PC", "PW", "RE", "RO", "RU", "SO", "TM", "US", "WR", "WT"];
            var isGameInfoProp = {};

            for ( var i = 0; i < gameInfoProps.length; i++ ) {
                isGameInfoProp[gameInfoProp[i]] = null;
            }

            return function (prop) {
                return isGameInfoProp.hasOwnProperty(prop);
            };
        }());

        that.validateCollection = function (c) {
            c.gameInfo = null;
        };

        that.FF4_validateNode = function (c, node) {
            var errors = [];
            var prop;
            
            for ( prop in node ) {
                if ( node.hasOwnProperty(prop) && this.isGameInfoProperty(prop) ) {
                    if ( c.gameInfo === null ) {
                        c.gameInfo = node;
                        break;
                    }
                    errors.push({
                        name: "GameInfoAlreadySet",
                        message: "game-info property "+prop+" outside game-info node"
                    });
                }
            }

            return errors;
        };

        that.FF4_revalidateNode = function (c, node) {
            if ( node === c.gameInfo ) {
                c.gameInfo = null;
            }
        };

        return that;
    };

}());
