/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var collection = require("../sgfgrove/collection.js");

    var R = { FF: 4, C: "root" },
        A = { C: "a" },
        B = { C: "b" },
        C = { C: "c" },
        D = { C: "d" },
        E = { C: "e" },
        F = { C: "f" },
        G = { C: "g" },
        H = { C: "h" },
        I = { C: "i" },
        J = { C: "j" };

    var GAME_TREE = [
        [R],
        [[
            [A, B],
            [
                [[C], []],
                [[D, E], []],
            ]
        ], [
            [F],
            [
                [[G, H, I], []],
                [[J], []]
            ]
        ]]
    ];

    test("SGFGrove.collection.gameTree: #forEach", function (t) {
        var gameTree = collection.gameTree(GAME_TREE);

        var preorder = [];
        gameTree.forEach(function (node) {
            preorder.push(node.properties());
        });

        t.deepEqual(
            preorder,
            [R, A, B, C, D, E, F, G, H, I, J],
            "pre-order callback"
        );

        var postorder = [];
        gameTree.forEach(null, function (node) {
            postorder.push(node.properties());
        });

        t.deepEqual(
            postorder,
            [C, E, D, B, A, I, H, G, J, F, R],
            "post-order callback"
        );

        var str = "";
        gameTree.forEach(
            function (node) {
                str += "(;"+node.properties().C;
            },
            function () {
                str += ")";
            }
        );

        t.equal(
            str,
            "(;root(;a(;b(;c)(;d(;e))))(;f(;g(;h(;i)))(;j)))",
            "both of pre-order and post-order callbacks"
        );

        t.end();
    });

    test("SGFGrove.collection.gameTree: #find", function (t) {
        var gameTree = collection.gameTree(GAME_TREE);
        
        var node = gameTree.find(function (n) {
            return n.isLeaf();
        });

        t.equal(node.properties(), C);

        t.end();
    });

    test("SGFGrove.collection.gameTree: #next", function (t) {
        var gameTree = collection.gameTree(GAME_TREE),
            node = gameTree,
            order = [];

        while (node) {
            order.push(node.properties());
            node = node.next();
        }

        t.deepEqual(
            order,
            [R, A, B, C, D, E, F, G, H, I, J]
        );

        t.end();
    });

    test("SGFGrove.collection.gameTree: #previous", function (t) {
        var gameTree = collection.gameTree(GAME_TREE);

        var node = gameTree;
        while (node.next()) {
            node = node.next();
        }

        var order = [];
        while (node) {
            order.push(node.properties());
            node = node.previous();
        }

        t.deepEqual(
            order,
            [R, A, B, C, D, E, F, G, H, I, J].reverse()
        );

        t.end();
    });


}());

