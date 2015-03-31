var test = require("tape");
var SGF = require("../../sgfgrove.js");

require("../../sgfgrove/collection.js");

test("SGFGrove.collection.gameTree: default", function (t) {
  var gameTree = SGF.collection.gameTree();

  var methods = [
    "create",
    "toSGF",
    "toJSON",
    "getHeight",
    "getLeafCount",
    "clone",
    // iterator methods
    "getDepth",
    //"getIndex",
    "getNode",
    "getParent",
    "getSiblings",
    "getChildren",
    "getChildCount",
    //"getChild",
    "isRoot",
    "isLeaf",
    "rewind",
    "next",
    "hasNext",
    "peek",
    "previous",
    "hasPrevious",
    "lookBack",
    // mutator methods
    "setNode",
    "insertChildAt",
    "appendChild",
    "removeChildAt",
    "replaceChildAt"
  ];

  for ( var i = 0; i < methods.length; i++ ) {
    t.ok( typeof gameTree[methods[i]] === "function" );
  }

  t.deepEqual(
    gameTree.tree,
    [
      [{
        FF: 4,
        GM: 1,
        CA: "UTF-8",
        AP: ["SGFGrove", SGF.VERSION]
      }],
      []
    ]
  );

  t.equal( gameTree.getLeafCount(), 1 );
  t.equal( gameTree.getHeight(), 0 );
  t.equal( gameTree.toSGF(), gameTree.tree );
  t.equal( gameTree.toJSON(), gameTree.tree );

  t.end();
});

test("SGFGrove.collection.gameTree: #clone", function (t) {
  var gameTree = SGF.collection.gameTree();
  var clone = gameTree.clone();

  t.ok( clone !== gameTree ); 
  t.ok( clone.tree !== gameTree.tree ); 
  t.deepEqual( clone.tree, gameTree.tree );

  t.end();
});

test("SGFGrove.collection.gameTree: "+
     "#clone should invoke the #clone method of the given data", function (t) {
  var gameTree = SGF.collection.gameTree([
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
    clone.tree, 
    [
      [{
        FF: 4,
        C: "#clone was invoked"
      }],
      []
    ]
  );

  t.end();
});

/*
test("SGFGrove.collection.gameTree: "+
     "#clone rejects duplicate references", function (t) {
  var duplicate = ["aa", "bb"];

  var gameTree = SGF.collection.gameTree([
    [{
      FF: 4,
      AB: duplicate,
      AE: duplicate
    }],
    []
  ]);

  t.throws(
    function () {
      gameTree.clone();
    },
    Error
  );

  t.end();
});

test("SGFGrove.collection.gameTree: " +
     "#clone accepts duplicate references " +
     "if and only if the object has a #clone method", function (t) {
  var duplicate = {
    clone: function () {
      return this;
    }
  };

  var gameTree = SGF.collection.gameTree([
    [{
      FF: 4,
      AB: duplicate,
      AE: duplicate
    }],
    []
  ]);

  t.doesNotThrow(
    function () {
      gameTree.clone();
    },
    Error
  );

  t.end();
});
*/

test("SGFGrove.collection.gameTree: "+
     "#clone does not copy the iterator state", function (t) {
  var gameTree = SGF.collection.gameTree([
    [{ FF: 4, C: "root" }, { C: "a" }],
    []
  ]);

  gameTree.next();
  gameTree.next();

  t.deepEqual( gameTree.getNode(), { C: "a" } );
  t.deepEqual( gameTree.clone().getNode(), { FF: 4, C: "root" } );

  t.end();
});

