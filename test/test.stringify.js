/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../sgfgrove.js");

    test("SGFGrove.stringify", function (t) {
        t.equal(
            SGF.stringify(),
            undefined,
            "SGFGrove.stringify(undefined) should return undefined"
        );

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
            SGF.stringify([[[{}], []]]),
            "(;)",
            "empty node"
        );

        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: "root"
                }],
                [[
                    [{
                        C: "a"
                    }],
                    [[
                        [{
                            C: "b"
                        }],
                        []
                    ],[
                        [{
                            C: "c"
                        }],
                        []
                    ]]
                ]]
            ]]),
            "(;FF[4]C[root];C[a](;C[b])(;C[c]))",
            "(;a(;b(;c)(;d))) => (;a;b(;c)(;d))"
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

        t.end();
    });

    test("SGFGrove.stringify: toSGF method", function (t) {
        t.plan(3);

        var C = {
            value: "root",
            toSGF: function (key) {
                t.equal(this, C, "should be called as the method on the object");
                t.equal(key, "C", "should be passed the key associated with the value");
                return this.value;
            }
        };
 
        t.equal(
            SGF.stringify([[
                [{
                    FF: 4,
                    C: C
                }],
                []
            ]]),
            "(;FF[4]C[root])",
            "the return value should be used as the property value"
        );
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

        t.throws(
            function () {
                SGF.stringify([[[{}],[]]], true);
            },
            Error
        );

        t.end();
    });

    test("SGFGrove.stringify: space", function (t) {
        var collection = [[
            [{
                FF: 4,
                C: "root"
            }],
            [[
                [{
                    C: "a"
                }],
                []
            ], [
                [{
                    C: "b"
                }],
                []
            ]]
        ]];

        t.equal(
            SGF.stringify(collection, null, 4),
            "(\n"+
            "    ;FF[4]\n"+
            "     C[root]\n"+
            "    (\n"+
            "        ;C[a]\n"+
            "    )\n"+
            "    (\n"+
            "        ;C[b]\n"+
            "    )\n"+
            ")\n",
            "number"
        );

        t.equal(
            SGF.stringify(collection, null, "\t"),
            "(\n"+
            "\t;FF[4]\n"+
            "\t C[root]\n"+
            "\t(\n"+
            "\t\t;C[a]\n"+
            "\t)\n"+
            "\t(\n"+
            "\t\t;C[b]\n"+
            "\t)\n"+
            ")\n",
            "string"
        );

        t.end();
    });

}());
