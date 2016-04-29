/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../sgfgrove.js");

    /*
     *  copied and rearranged from underscore.js:
     *  http://underscorejs.org/
     */

    test("SGFGrove.Util.isNumber", function (t) {
        var isNumber = SGF.Util.isNumber;
        t.ok(!isNumber("string"), "a string is not a number");
        t.ok(!isNumber(arguments), "the arguments object is not a number");
        t.ok(!isNumber(void 0), "undefined is not a number");
        t.ok(!isNumber(NaN), "NaN is not a number");
        t.ok(!isNumber(Infinity), "Infinity is not a number");
        t.ok(!isNumber("1"), "numeric strings are not numbers");
        t.ok(isNumber(3*4-7/10), "but numbers are");
        t.end();
    });

}());

