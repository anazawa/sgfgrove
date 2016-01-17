/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../sgfgrove.js");

    /*
     *  copied and rearranged from underscore.js:
     *  http://underscorejs.org/
     */

    test("SGFGrove.Util.isArray", function (t) {
        var isArray = SGF.Util.isArray;
        t.ok(!isArray(void 0), "undefined vars are not arrays");
        t.ok(!isArray(arguments), "the arguments object is not an array");
        t.ok(isArray([1, 2, 3]), "but arrays are");
        t.end();
    });

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

    test("SGFGrove.Util.create", function (t) {
        var create = SGF.Util.create;

        var Parent = function () {};
            Parent.prototype = { foo: function () {}, bar: 2 };

        var Child = function () {};
            Child.prototype = create(Parent.prototype);

        t.ok(new Child instanceof Parent, "object should inherit prototype");

        t.end();
    });

}());

