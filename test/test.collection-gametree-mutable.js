/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../sgfgrove.js");
    var collection = require("../sgfgrove/collection.js");

    var gameTree = function (text) {
        return collection.gameTree(SGF.parse(text)[0]);
    };

    test("SGFGrove.collection.gameTree: #append", function (t) {
        var gameTree1 = gameTree("(;FF[4])");
            gameTree1.append(gameTree1.create({ C: "a" }));

        t.equal(
            gameTree1.toString(),
            "(;FF[4];C[a])"
        );

        var gameTree2 = gameTree("(;FF[4];C[a])");
            gameTree2.append(gameTree2.create({ C: "b" }));

        t.equal(
            gameTree2.toString(),
            "(;FF[4](;C[a])(;C[b]))"
        );

        t.end();
    });

    test("SGFGrove.collection.gameTree: #prepend", function (t) {
        var gameTree1 = gameTree("(;FF[4])");
            gameTree1.prepend(gameTree1.create({ C: "a" }));

        t.equal(
            gameTree1.toString(),
            "(;FF[4];C[a])"
        );

        var gameTree2 = gameTree("(;FF[4];C[a])");
            gameTree2.prepend(gameTree2.create({ C: "b" }));

        t.equal(
            gameTree2.toString(),
            "(;FF[4](;C[b])(;C[a]))"
        );

        t.end();
    });

    test("SGFGrove.collection.gameTree: #before", function (t) {
        var gameTree1 = gameTree("(;FF[4];C[a])");

        var node1 = gameTree1.children()[0];
            node1.before(gameTree1.create({ C: "b" }));

        t.equal(
            gameTree1.toString(),
            "(;FF[4](;C[b])(;C[a]))"
        );

        var gameTree2 = gameTree("(;FF[4])");

        t.throws(
            function () {
                gameTree2.before(gameTree2.create({ C: "a" }));
            },
            Error
        );

        t.end();
    });

    test("SGFGrove.collection.gameTree: #after", function (t) {
        var gameTree1 = gameTree("(;FF[4];C[a])");

        var node1 = gameTree1.children()[0];
            node1.after(gameTree1.create({ C: "b" }));

        t.equal(
            gameTree1.toString(),
            "(;FF[4](;C[a])(;C[b]))"
        );

        var gameTree2 = gameTree("(;FF[4])");

        t.throws(
            function () {
                gameTree2.after(gameTree2.create({ C: "a" }));
            },
            Error
        );

        t.end();
    });

    test("SGFGrove.collection.gameTree: #replaceWith", function (t) {
        var gameTree1 = gameTree("(;FF[4];C[a])");

        var node1 = gameTree1.children()[0];
            node1.replaceWith(gameTree1.create({ C: "b" }));

        t.equal(
            gameTree1.toString(),
            "(;FF[4];C[b])"
        );

        var gameTree2 = gameTree("(;FF[4])");

        t.throws(
            function () {
                gameTree2.replaceWith(gameTree2.create({ C: "a" }));
            },
            Error
        );

        t.end();
    });
 
    test("SGFGrove.collection.gameTree: #detach", function (t) {
        var gameTree1 = gameTree("(;FF[4](;C[a])(;C[b]))");

        var node1 = gameTree1.children()[0];
            node1.detach();

        t.equal(
            gameTree1.toString(),
            "(;FF[4];C[b])"
        );

        t.ok(node1.isRoot());

        t.end();
    });

    test("SGFGrove.collection.gameTree: #empty", function (t) {
        var gameTree1 = gameTree("(;FF[4](;C[a])(;C[b]))");
            gameTree1.empty();

        t.equal(
            gameTree1.toString(),
            "(;FF[4])"
        );

        t.end();
    });

}());
