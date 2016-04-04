/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGFGrove = require("../sgfgrove.js");
    var properties = SGFGrove.fileFormat({ FF: 4 }).properties();

    test("FF[4] AP", function (t) {
        var AP = properties.typeOf.AP;

        t.deepEqual( AP.parse(["myapp:1.2.3"]), ["myapp", "1.2.3"] );

        t.deepEqual( AP.parse(["foo\\\\:bar"]), ["foo\\", "bar"] );
        t.deepEqual( AP.parse(["foo\\:bar:baz"]), ["foo:bar", "baz"] );
        t.deepEqual( AP.parse(["foo:bar\\:baz"]), ["foo", "bar:baz"] );
        t.deepEqual( AP.parse(["foo:bar:baz"]), undefined );

        t.deepEqual( AP.stringify(["myapp", "1.2.3"]), ["myapp:1.2.3"] );

        t.end();
    });

    test("FF[4] SZ", function (t) {
        var SZ = properties.typeOf.SZ;

        t.equal( SZ.parse(["19"]), 19 );
        t.deepEqual( SZ.parse(["12:34"]), [12, 34] );

        t.deepEqual( SZ.stringify(19), ["19"] );
        t.deepEqual( SZ.stringify([12, 34]), ["12:34"] );

        t.end();
    });

    test("FF[4] FG", function (t) {
        var FG = properties.typeOf.FG;

        t.equal( FG.parse([""]), null );
        t.deepEqual( FG.parse(["257:fig"]), [257, "fig"] );

        t.deepEqual( FG.stringify(null), [""] );
        t.deepEqual( FG.stringify([257, "fig"]), ["257:fig"] );

        t.end();
    });

}());
