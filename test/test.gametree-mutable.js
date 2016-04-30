/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../lib/sgfgrove.js");
    var gameTree = require("../lib/sgfgrove/gametree.js");

    var fromString = function (text) {
        return gameTree(SGF.parse(text)[0]);
    };

    test("SGFGrove.collection.gameTree: #append", function (t) {
        var tree1 = fromString("(;FF[4])");
            tree1.append(tree1.create({ C: "a" }));

        t.equal(
            tree1.toString(),
            "(;FF[4];C[a])"
        );

        var tree2 = fromString("(;FF[4];C[a])");
            tree2.append(tree2.create({ C: "b" }));

        t.equal(
            tree2.toString(),
            "(;FF[4](;C[a])(;C[b]))"
        );

        t.end();
    });

    test("SGFGrove.gameTree: #prepend", function (t) {
        var tree1 = fromString("(;FF[4])");
            tree1.prepend(tree1.create({ C: "a" }));

        t.equal(
            tree1.toString(),
            "(;FF[4];C[a])"
        );

        var tree2 = fromString("(;FF[4];C[a])");
            tree2.prepend(tree2.create({ C: "b" }));

        t.equal(
            tree2.toString(),
            "(;FF[4](;C[b])(;C[a]))"
        );

        t.end();
    });

    test("SGFGrove.gameTree: #before", function (t) {
        var tree1 = fromString("(;FF[4];C[a])");

        var node1 = tree1.children()[0];
            node1.before(tree1.create({ C: "b" }));

        t.equal(
            tree1.toString(),
            "(;FF[4](;C[b])(;C[a]))"
        );

        var tree2 = fromString("(;FF[4])");

        t.throws(
            function () {
                tree2.before(tree2.create({ C: "a" }));
            },
            Error
        );

        t.end();
    });

    test("SGFGrove.gameTree: #after", function (t) {
        var tree1 = fromString("(;FF[4];C[a])");

        var node1 = tree1.children()[0];
            node1.after(tree1.create({ C: "b" }));

        t.equal(
            tree1.toString(),
            "(;FF[4](;C[a])(;C[b]))"
        );

        var tree2 = fromString("(;FF[4])");

        t.throws(
            function () {
                tree2.after(tree2.create({ C: "a" }));
            },
            Error
        );

        t.end();
    });

    test("SGFGrove.gameTree: #replaceWith", function (t) {
        var tree1 = fromString("(;FF[4];C[a])");

        var node1 = tree1.children()[0];
            node1.replaceWith(tree1.create({ C: "b" }));

        t.equal(
            tree1.toString(),
            "(;FF[4];C[b])"
        );

        var tree2 = fromString("(;FF[4])");

        t.throws(
            function () {
                tree2.replaceWith(tree2.create({ C: "a" }));
            },
            Error
        );

        t.end();
    });
 
    test("SGFGrove.gameTree: #detach", function (t) {
        var tree1 = fromString("(;FF[4](;C[a])(;C[b]))");

        var node1 = tree1.children()[0];
            node1.detach();

        t.equal(
            tree1.toString(),
            "(;FF[4];C[b])"
        );

        t.ok(node1.isRoot());

        t.end();
    });

    test("SGFGrove.gameTree: #empty", function (t) {
        var tree1 = fromString("(;FF[4](;C[a])(;C[b]))");
            tree1.empty();

        t.equal(
            tree1.toString(),
            "(;FF[4])"
        );

        t.end();
    });

}());
