/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../sgfgrove.js");

    test("SGFGrove.stringify: default", function (t) {
        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: "root"
                }],
                []
            ]]),
            "(;FF[4]C[root])"
        );

        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: "root",
                    foo: "bar"
                }],
                []
            ]]),
            "(;FF[4]C[root])",
            "non-SGF property should be ignored"
        );

        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    FOO: {
                        bar: "baz",
                        toSGF: function () {
                            return [this.bar];
                        }
                    }
                }],
                []
            ]]),
            "(;FF[4]FOO[baz])",
            "toSGF method should be invoked"
        );
 
        t.end();
    });

    test("SGFGrove.stringify: replacer", function (t) {
        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: "root"
                }],
                []
            ]], function (key, value) {
                return key === "C" ? value.toUpperCase() : value;
            }),
            "(;FF[4]C[ROOT])",
            "function: property value should be replaced"
        );

        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: "root"
                }],
                []
            ]], function (key, value) {
                if ( key !== "C" ) {
                    return value;
                }
            }),
            "(;FF[4])",
            "function: property value should be deleted"
        );

        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: "root"
                }],
                []
            ]], ["FF"]),
            "(;FF[4])",
            "array: selected properties should be stringified"
        );

        t.end();
    });

}());
