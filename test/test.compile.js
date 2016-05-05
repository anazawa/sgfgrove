/* global require */
(function () {
    "use strict";

    var test = require("tape");

    test("compile", function (t) {
        t.doesNotThrow(
            function () {
                require("../lib/sgfgrove.js");
            }
        );
        t.end();
    });

}());
