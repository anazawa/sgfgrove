/* global require */
(function () {
    "use strict";

    var test = require("tape");
    var SGF = require("../../sgfgrove.js");

    require("../../sgfgrove/collection.js");

    test("SGFGrove.collection.gameTree: " +
         "#next should behave like depth-first search", function (t) {
        var i, name;

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

        var gameTree = SGF.collection.gameTree([
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
        ]);

        var data = [
            {
                node      : R,
                ancestors : [R],
                parent    : null,
                siblings  : null,
                children  : [A, F],
                childCount    : 2,
                depth     : 0,
                index     : null,
                height    : 4,
                leafCount : 4,
                isRoot    : true,
                isLeaf    : false
            },
            {
                node      : A,
                ancestors : [R, A],
                parent    : R,
                siblings  : [A, F],
                children  : [B],
                childCount    : 1,
                depth     : 1,
                index     : 0,
                height    : 3,
                leafCount : 2,
                isRoot    : false,
                isLeaf    : false
            },
            {
                node      : B,
                ancestors : [R, A, B],
                parent    : A,
                siblings  : [B],
                children  : [C, D],
                childCount    : 2,
                depth     : 2,
                index     : 0,
                height    : 2,
                leafCount : 2,
                isRoot    : false,
                isLeaf    : false
            },
            {
                node      : C,
                ancestors : [R, A, B, C],
                parent    : B,
                siblings  : [C, D],
                children  : [],
                childCount    : 0,
                depth     : 3,
                index     : 0,
                height    : 0,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : true
            },
            {
                node      : D,
                ancestors : [R, A, B, D],
                parent    : B,
                siblings  : [C, D],
                children  : [E],
                childCount    : 1,
                depth     : 3,
                index     : 1,
                height    : 1,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : false
            },
            {
                node      : E,
                ancestors : [R, A, B, D, E],
                parent    : D,
                siblings  : [E],
                children  : [],
                childCount    : 0,
                depth     : 4,
                index     : 0,
                height    : 0,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : true
            },
            {
                node      : F,
                ancestors : [R, F],
                parent    : R,
                siblings  : [A, F],
                children  : [G, J],
                childCount    : 2,
                depth     : 1,
                index     : 1,
                height    : 3,
                leafCount : 2,
                isRoot    : false,
                isLeaf    : false
            },
            {
                node      : G,
                ancestors : [R, F, G],
                parent    : F,
                siblings  : [G, J],
                children  : [H],
                childCount    : 1,
                depth     : 2,
                index     : 0,
                height    : 2,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : false
            },
            {
                node      : H,
                ancestors : [R, F, G, H],
                parent    : G,
                siblings  : [H],
                children  : [I],
                childCount    : 1,
                depth     : 3,
                index     : 0,
                height    : 1,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : false
            },
            {
                node      : I,
                ancestors : [R, F, G, H, I],
                parent    : H,
                siblings  : [I],
                children  : [],
                childCount    : 0,
                depth     : 4,
                index     : 0,
                height    : 0,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : true
            },
            {
                node      : J,
                ancestors : [R, F, J],
                parent    : F,
                children  : [],
                childCount    : 0,
                siblings  : [G, J],
                depth     : 2,
                index     : 1,
                height    : 0,
                leafCount : 1,
                isRoot    : false,
                isLeaf    : true
            }
        ];

        var testState = function (d, n) {
            t.equal( gameTree.getNode(),   d.node,   n+": #getNode"   );
            t.equal( gameTree.getParent(), d.parent, n+": #getParent" );
            t.equal( gameTree.getChildCount(), d.childCount, n+": #getChildCount" );
            t.equal( gameTree.getDepth(),  d.depth,  n+": #getDepth"  );
            t.equal( gameTree.getIndex(),  d.index,  n+": #getIndex"  );
            t.equal( gameTree.getHeight(), d.height, n+": #getHeight" );
            t.equal( gameTree.getLeafCount(), d.leafCount, n+": #getLeafCount" );
    
            t.equal( gameTree.isLeaf(), d.isLeaf, n+": #isLeaf" );
            t.equal( gameTree.isRoot(), d.isRoot, n+": #isRoot" );

            t.deepEqual( gameTree.getSiblings(), d.siblings,   n+": #getSiblings"  );
            t.deepEqual( gameTree.getChildren(), d.children,   n+": #getChildren"  );
            t.deepEqual( gameTree.getAncestors(), d.ancestors, n+": #getAncestors" );
        };

        testState( data[0], "initial state" );

        for ( i = 0; i < data.length; i++ ) {
            name = "next to '" + (i !== 0 ? data[i-1].node.C : "") + "'";
            t.equal( gameTree.hasNext(), true, name+": #hasNext" );
            t.deepEqual( gameTree.peek(), data[i].node, name+": #peek" );
            t.deepEqual( gameTree.next(), data[i].node, name+": #next" );
            testState( data[i], name );
        }

        name = "next to 'j'";
        t.equal( gameTree.hasNext(), false, name+": #hasNext" );
        t.equal( gameTree.peek(), null, name+": #peek" );
        t.equal( gameTree.next(), null, name+": #next" );
        testState( data[data.length-1], name );

        for ( i = data.length-2; i >= 0; i-- ) {
            name = "previous to '" + data[i+1].node.C + "'";
            t.equal( gameTree.hasPrevious(), true, name+": #hasPrevious" );
            t.deepEqual( gameTree.lookBack(), data[i].node, name+": #lookBack" );
            t.deepEqual( gameTree.previous(), data[i].node, name+": #previous" );
            testState( data[i], name );
        }

        name = "previous to 'root'";
        t.equal( gameTree.hasPrevious(), false, name+": #hasPrevious" );
        t.equal( gameTree.lookBack(), null, name+": #lookBack" );
        t.equal( gameTree.previous(), null, name+": #previous" );
        testState( data[0], name );

        while ( gameTree.hasNext() ) { gameTree.next(); }
        t.equal( gameTree.rewind(), gameTree, "#rewind should return the invocant" );
        testState( data[0], "after #rewind" );

        t.end();
    });

}());
