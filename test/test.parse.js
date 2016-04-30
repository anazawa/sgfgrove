/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../lib/sgfgrove.js");

    require("../lib/sgfgrove/ff123.js");

    test("SGFGrove.parse", function (t) {
        t.deepEqual(
            SGF.parse(" (\n ;\t FF\r\n [4]  \n\r)\v"),
            [[[{ FF: 4 }], []]],
            "white spaces should be ignored"
        );

        t.deepEqual(
            SGF.parse("(;FF[4]C[root](;C[a](;C[b])))"),
            [[[{ FF: 4, C: "root" }, { C: "a" }, { C: "b" }], []]],
            "GameTree should be normalized, ignoring redundant parentheses"
        );

        t.deepEqual(
            SGF.parse("(;FF[4]C[foo\\\\]GC[bar])"),
            [[[{ FF: 4, C: "foo\\", GC: "bar" }], []]],
            "escaped backslash at end of PropValue"
        );

        t.end();
    });

    test("SGFGrove.parse: reviver", function (t) {
        t.deepEqual(
            SGF.parse("(;FF[4]C[root])", function (key, value) {
                if ( key === "C" ) {
                    return value.toUpperCase();
                }
                else {
                    return value;
                }
            }),
            [[[{ FF: 4, C: "ROOT" }], []]],
            "overwrite property values"
        );

        t.deepEqual(
            SGF.parse("(;FF[4]C[root])", function (key, value) {
                if ( key !== "C" ) {
                    return value;
                }
            }),
            [[[{ FF: 4 }], []]],
            "exclude properties"
        );

        t.end();
    });

    test("SGF.parse: SyntaxError", function (t) {
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

        t.throws(
            function () {
                SGF.parse("(;FF[4]CoPyright[copyright])");
            },
            SyntaxError,
            "FF[4] does not allow lower-case letters in PropIdent"
        );

        t.end();
    });

    test("SGF.parse: FF[4]", function (t) {
        t.throws(
            function () {
                SGF.parse("(;FF[4]1NVALID[invalid])");
            },
            SyntaxError,
            "invalid PropIdent"
        );
        t.end();
    });

}());

