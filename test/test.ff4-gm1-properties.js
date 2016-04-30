/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGFGrove = require("../lib/sgfgrove.js");
    var properties = SGFGrove.fileFormat({ FF: 4, GM: 1 }).properties();

    test("FF[4] AR", function (t) {
        var AR = properties.typeOf.AR;

        t.deepEqual( AR.parse(["aa:bb"]), [["aa", "bb"]] );
        t.deepEqual( AR.stringify([["aa", "bb"]]), ["aa:bb"] );

        t.end();
    });

    test("FF[4] LB", function (t) {
        var LB = properties.typeOf.LB;

        t.deepEqual( LB.parse(["aa:label"]), [["aa", "label"]] );
        t.deepEqual( LB.stringify([["aa", "label"]]), ["aa:label"] );

        t.end();
    });

}());
