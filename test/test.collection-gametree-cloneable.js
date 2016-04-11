/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var collection = require("../sgfgrove/collection.js");

    test("SGFGrove.collection.gameTree: #clone", function (t) {
        var gameTree = collection.gameTree([
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

        var clone = gameTree.clone();

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
