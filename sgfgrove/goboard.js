(function () {
    "use strict";

    var SGFGrove;

    var goBoard = function () {
        var that = goBoard.object();

        var EMPTY = goBoard.EMPTY,
            BLACK = goBoard.BLACK,
            WHITE = goBoard.WHITE;

        that.defineAttribute("system");
        that.defineAttribute("board");
        that.defineAttribute("blackCaptures");
        that.defineAttribute("whiteCaptures");
        that.defineAttribute("labels");
        that.defineAttribute("lines");
        that.defineAttribute("arrows");

        that.initialize = (function (superInitialize) {
            return function (size) {
                superInitialize.apply(this, arguments);
                this.system("abcdefghijklmnopqrstuvwxyz".slice(0, size || 19));
                this.board(this.buildBoard());
                this.blackCaptures(0);
                this.whiteCaptures(0);
                this.labels([]);
                this.lines([]);
                this.arrows([]);
            };
        }(that.initialize));

        that.buildBoard = function () {
            var size = this.system().length;

            var board = [];
            for (var y = 0; y < size+2; y++) {
                for (var x = 0; x < size+2; x++) {
                    var z = x+(size+2)*y;
                    if (x > 0 && x < size+1 && y > 0 && y < size+1) {
                        board[z] = EMPTY;
                    }
                    else {
                        board[z] = BLACK | WHITE;
                    }
                }
            }
 
            return board;
        };

        that.execute = function (properties) {
            for (var ident in properties) {
                if (properties.hasOwnProperty(ident)) {
                    var value = properties[ident];
                    switch (ident) {
                        case "B":
                            this.blackMove(value);
                            break;
                        case "W":
                            this.whiteMove(value);
                            break;
                    }
                }
            }
        };

        that.parsePoint = function (point) {
            var system = this.system();
            var x = system.indexOf(point.charAt(0));
            var y = system.indexOf(point.charAt(1));
            return (x+1)+(system.length+2)*(y+1);
        };

        that.move = function (point, color) {
            var z = this.parsePoint(point);
            this.board()[z] |= color;
            return this;
        };

        that.blackMove = function (point) {
            return this.move(point, BLACK);
        };

        that.whiteMove = function (point) {
            return this.move(point, WHITE);
        };

        that.toString = function () {
            var board = this.board();
            var size = this.system().length;

            var text = "";
            for (var y = 1; y < size+1; y++) {
                for (var x = 1; x < size+1; x++) {
                    var z = x+(size+2)*y;
                    if (board[z] & BLACK) {
                        text += "X";
                    }
                    else if (board[z] & WHITE) {
                        text += "O";
                    }
                    else {
                        text += ".";
                    }
                }
                text += "\n";
            }

            return text;
        };

        return that.create.apply(that, arguments);
    };

    goBoard.EMPTY = 0;
    goBoard.BLACK = 1;
    goBoard.WHITE = 2;

    goBoard.object = function () {
        var that = {};

        that.create = function () {
            var other = SGFGrove.Util.create(this);
            other.initialize.apply(other, arguments);
            return other;
        };

        that.initialize = function () {
            this.$attributes = {};
        };

        that.defineAttribute = function (name) {
            this[name] = function () {
                if (arguments.length) {
                    this.$attributes[name] = arguments[0];
                    return this;
                }
                return this.$attributes[name];
            };
            return this;
        };

        return that.create.apply(that, arguments);
    };

    if (typeof exports !== "undefined") {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
        module.exports = goBoard; // jshint ignore:line
    }
    else {
        SGFGrove = window.SGFGrove;
        SGFGrove.goBoard = goBoard;
    }

}());

