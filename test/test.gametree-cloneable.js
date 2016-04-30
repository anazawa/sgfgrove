/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var gameTree = require("../lib/sgfgrove/gametree.js");

    test("SGFGrove.gameTree: #clone", function (t) {
        var tree = gameTree([
            [{
                FF: 4,
                C: {
                    clone: function () {
                        return "#clone was invoked";
                    }
                }
            }],
            []
        ]);

        var clone = tree.clone();

        t.deepEqual(
            clone.properties(), 
            {
                FF: 4,
                C: "#clone was invoked"
            },
            "#clone should invoke #clone method"
        );

        t.end();
    });

}());
