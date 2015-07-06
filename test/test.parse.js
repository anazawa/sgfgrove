/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../sgfgrove.js");

    require("../sgfgrove/ff123.js");

    test("SGFGrove.parse: reviver: overwrite property values", function (t) {
        var collection = SGF.parse("(;FF[4]C[root])", function (key, value) {
            if ( key === "C" ) {
                return value.toUpperCase();
            }
            else {
                return value;
            }
        });

        t.deepEqual(
            collection,
            [[[{ FF: 4, C: "ROOT" }], []]],
            "C should be upper-case"
        );

        t.end();
    });

    test("SGFGrove.parse: reviver: exclude properties", function (t) {
        var collection = SGF.parse("(;FF[4]C[root])", function (key, value) {
            if ( key !== "C" ) {
                return value;
            }
        });

        t.deepEqual(
            collection,
            [[[{ FF: 4 }], []]],
            "C should be excluded"
        );

        t.end();
    });

    test("SGF.parse: SyntaxError", function (t) {
        t.deepEqual(
            SGF.parse(" (\n ;\t FF\r\n [4]  \n\r)\v"),
            [[[{ FF: 4 }], []]],
            "white spaces are ignored"
        );

        t.throws(
            function () {
                SGF.parse("(;FF[4];B[aa]B[bb])");
            },
            SyntaxError,
            "duplicate property"
        );

        t.throws(
            function () {
                SGF.parse("(;FF[4]extra)");
            },
            SyntaxError,
            "extra characters"
        );

        t.throws(
            function () {
                SGF.parse("(FF[4])");
            },
            SyntaxError,
            "semicolon is missing"
        );

        t.throws(
            function () {
                SGF.parse("()");
            },
            SyntaxError,
            "empty GameTree"
        );

        t.throws(
            function () {
                SGF.parse("(;FF[4]");
            },
            SyntaxError,
            "unclosed GameTree"
        );

        t.throws(
            function () {
                SGF.parse("(;FF)");
            },
            SyntaxError,
            "PropValue is missing"
        );

        t.throws(
            function () {
                SGF.parse("(;FF[4];B[aa)");
            },
            SyntaxError,
            "unclosed PropValue"
        );

        t.throws(
            function () {
                SGF.parse("(;FF[4]C[foo [2k]: hi])");
            },
            SyntaxError,
            "unescaped closing bracket"
        );

        t.end();
    });

    /*
    test("SGF.parse: Syntax: FF[4]", function (t) {
        t.throws(
            function () {
                SGF.parse("(;FF[4]1NVALID[invalid])");
            },
            SyntaxError,
            "invalid PropIdent"
        );
        t.end();
    });
    */

    test("SGFGrove.parse: FF[3] PropIdent", function (t) {
        var collection = SGF.parse("(;FF[3]CoPyright[copyright])");

        t.deepEqual(
            collection,
            [[[{ FF: 3, CP: "copyright" }], []]],
            "lower-case letters should be ignored"
        );

        t.end();
    });

    test("SGFGrove.parse: redundant parentheses are ignored", function (t) {
        t.deepEqual(
            SGF.parse("(;FF[4]C[root](;C[a](;C[b])))"),
            [[[{ FF: 4, C: "root" }, { C: "a" }, { C: "b" }], []]]
        );
        t.end();
    });

}());

