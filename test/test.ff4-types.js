/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGFGrove = require("../sgfgrove.js");
    var FF = SGFGrove.getFileFormat();

    test("FF[4] Number", function (t) {
        var SGFNumber = FF[4].Types.Number;

        t.equal( SGFNumber.parse(["123"]), 123 );
        t.equal( SGFNumber.parse(["+123"]), 123 );
        t.equal( SGFNumber.parse(["-123"]), -123 );

        t.deepEqual( SGFNumber.stringify(123), ["123"] );
        t.deepEqual( SGFNumber.stringify(-123), ["-123"] );

        t.equal( SGFNumber.parse(["string"]), undefined );
        t.equal( SGFNumber.stringify("string"), undefined );

        t.end();
    });

    test("FF[*] Unknown", function (t) {
        var Unknown = FF.Types.Unknown;

        t.deepEqual( Unknown.parse(["\\]"]), ["]"] );
        t.deepEqual( Unknown.stringify(["]"]), ["\\]"] );

        t.end();
    });

    test("FF[4] None", function (t) {
        var None = FF[4].Types.None;

        t.equal( None.parse([""]), null );
        t.deepEqual( None.stringify(null), [""] );

        t.equal( None.parse(['invalid']), undefined );
        t.equal( None.stringify('invalid'), undefined );

        t.end();
    });

    test("FF[4] Double", function (t) {
        var Double = FF[4].Types.Double;

        t.equal( Double.parse(["1"]), 1 );
        t.equal( Double.parse(["2"]), 2 );
        t.equal( Double.parse(["3"]), undefined );

        t.deepEqual( Double.stringify(1), ["1"] );
        t.deepEqual( Double.stringify(2), ["2"] );
        t.equal( Double.stringify(3), undefined );

        t.end();
    });

    test("FF[4] Real", function (t) {
        var Real = FF[4].Types.Real;

        t.equal( Real.parse(["1.23"]), 1.23 );
        t.equal( Real.parse(["+1.23"]), 1.23 );
        t.equal( Real.parse(["-1.23"]), -1.23 );

        t.deepEqual( Real.stringify(1.23), ["1.23"] );
        t.deepEqual( Real.stringify(-1.23), ["-1.23"] );

        t.equal( Real.parse(["string"]), undefined );
        t.equal( Real.stringify("string"), undefined );

        t.end();
    });

    test("FF[4] Color", function (t) {
        var Color = FF[4].Types.Color;

        t.equal( Color.parse(["B"]), "B" );
        t.equal( Color.parse(["W"]), "W" );
        t.equal( Color.parse(["b"]), undefined );

        t.deepEqual( Color.stringify("B"), ["B"] );
        t.deepEqual( Color.stringify("W"), ["W"] );
        t.equal( Color.stringify("b"), undefined );

        t.end();
    });

    test("FF[4] SimpleText", function (t) {
        var SimpleText = FF[4].Types.SimpleText;

        t.equal( SimpleText.parse(["\\]\\:\\\\"]), "]:\\" );
        t.equal( SimpleText.parse(["\n|\r|\t|\v"]), " | | | " );
        t.equal( SimpleText.parse(["\\\n|\\\n\r|\\\r|\\\r\n"]), "|||" );
        t.equal( SimpleText.parse(["item1", "item2"]), undefined );

        t.deepEqual( SimpleText.stringify("]:\\"), ["\\]\\:\\\\"] );
        t.equal( SimpleText.stringify(123), undefined );

        t.end();
    });

    test("FF[4] Text", function (t) {
        var Text = FF[4].Types.Text;

        t.equal( Text.parse(["\\]\\:\\\\"]), "]:\\" );
        t.equal( Text.parse(["\n|\r|\t|\v"]), "\n|\r| | " );
        t.equal( Text.parse(["\\\n|\\\n\r|\\\r|\\\r\n"]), "|||" );
        t.equal( Text.parse(["item1", "item2"]), undefined );

        t.deepEqual( Text.stringify("]:\\"), ["\\]\\:\\\\"] );
        t.equal( Text.stringify(123), undefined );

        t.end();
    });

    test("FF[4]GM[1] Point", function (t) {
        var Point = FF[4].GM[1].Types.Point;

        t.equal( Point.parse(["aa"]), "aa" );
        t.equal( Point.parse(["AA"]), "AA" );
        t.equal( Point.parse([""]), undefined );

        t.deepEqual( Point.stringify("aa"), ["aa"] );
        t.deepEqual( Point.stringify("AA"), ["AA"] );
        t.equal( Point.stringify(""), undefined );

        t.end();
    });

    test("FF[4]GM[1] Move", function (t) {
        var Move = FF[4].GM[1].Types.Move;

        t.equal( Move.parse(["aa"]), "aa" );
        t.equal( Move.parse(["AA"]), "AA" );
        t.equal( Move.parse([""]), null, "pass" );

        t.deepEqual( Move.stringify("aa"), ["aa"] );
        t.deepEqual( Move.stringify("AA"), ["AA"] );
        t.deepEqual( Move.stringify(null), [""], "pass" );

        t.end();
    });

    test("FF[4]GM[1] list of Point", function (t) {
        var listOfPoint = FF[4].GM[1].Types.listOfPoint;

        t.deepEqual( listOfPoint.parse(["aa", "bb"]), ["aa", "bb"] );

        t.deepEqual(
            listOfPoint.parse(["aa:bb"]),
            ["aa", "ba", "ab", "bb"],
            "compressed point list"
        );
  
        t.deepEqual(
            listOfPoint.parse(["bb:aa"]),
            ["aa", "ba", "ab", "bb"],
            "compressed point list"
        );

        t.deepEqual(
            listOfPoint.parse(["aa:bb", "cc"]),
            ["aa", "ba", "ab", "bb", "cc"],
            "compressed point list"
        );

        t.equal( listOfPoint.parse([""]), undefined, "can not be empty" );

        t.deepEqual( listOfPoint.stringify(["aa", "bb"]), ["aa", "bb"] );
        t.deepEqual( listOfPoint.stringify(["aa:bb"]), ["aa:bb"] );
        t.deepEqual( listOfPoint.stringify(["bb:aa"]), ["bb:aa"] );
        t.deepEqual( listOfPoint.stringify(["aa:bb", "cc"]), ["aa:bb", "cc"] );
        t.equal( listOfPoint.stringify([]), undefined, "can not be empty" );

        t.end();
    });

}());
