/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGFGrove = require("../sgfgrove.js");
    var FF = SGFGrove.fileFormat();

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
