/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGFGrove = require("../sgfgrove.js");
    var FF = SGFGrove.fileFormat();

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

        t.deepEqual( SimpleText.stringify("]\\"), ["\\]\\\\"] );
        t.equal( SimpleText.stringify(123), undefined );

        t.end();
    });

    test("FF[4] Text", function (t) {
        var Text = FF[4].Types.Text;

        t.equal( Text.parse(["\\]\\:\\\\"]), "]:\\" );
        t.equal( Text.parse(["\n|\r|\t|\v"]), "\n|\r| | " );
        t.equal( Text.parse(["\\\n|\\\n\r|\\\r|\\\r\n"]), "|||" );
        t.equal( Text.parse(["item1", "item2"]), undefined );

        t.deepEqual( Text.stringify("]\\"), ["\\]\\\\"] );
        t.equal( Text.stringify(123), undefined );

        t.end();
    });

}());
