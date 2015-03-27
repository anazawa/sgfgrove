var test = require("tape");
var SGF = require("../sgfgrove.js");

require("../sgfgrove/collection.js");

var sgfArray = [[
  [{ FF: 4, C: 'root' }],
  [[
    [{ C: 'a' }, { C: 'b' }],
    [
      [[{ C: 'c' }], []],
      [[{ C: 'd' }, { C: 'e' }], []],
    ]
  ], [
    [{ C: 'f' }],
    [
      [[{ C: 'g' }, { C: 'h' }, { C: 'i' }], []],
      [[{ C: 'j' }], []]
    ]
  ]]
]];

test("SGFGrove.collection.gameTree: " +
     "#next should behave like depth-first search", function (t) {
  var gameTree = SGF.collection.gameTree( sgfArray[0] );
  var i, name;

  var tests = [
    {
      current      : { FF: 4, C: "root" },
      parent       : undefined,
      siblings     : [], // XXX: undefined or exception?
      children     : [{ C: "a" }, { C: "f" }],
      currentDepth : 0,
      currentIndex : 0,
      isRoot       : true,
      isLeaf       : false
    },
    {
      current      : { C: "a" },
      parent       : { FF: 4, C: "root" },
      siblings     : [{ C: "a" }, { C: "f" }],
      children     : [{ C: "b" }],
      currentDepth : 1,
      currentIndex : 0,
      isRoot       : false,
      isLeaf       : false
    },
    {
      current      : { C: "b" },
      parent       : { C: "a" },
      siblings     : [{ C: "b" }],
      children     : [{ C: "c" }, { C: "d" }],
      currentDepth : 2,
      currentIndex : 0,
      isRoot       : false,
      isLeaf       : false
    },
    {
      current      : { C: "c" },
      parent       : { C: "b" },
      siblings     : [{ C: "c" }, { C: "d" }],
      children     : [],
      currentDepth : 3,
      currentIndex : 0,
      isRoot       : false,
      isLeaf       : true
    },
    {
      current      : { C: "d" },
      parent       : { C: "b" },
      siblings     : [{ C: "c" }, { C: "d" }],
      children     : [{ C: "e" }],
      currentDepth : 3,
      currentIndex : 1,
      isRoot       : false,
      isLeaf       : false
    },
    {
      current      : { C: "e" },
      parent       : { C: "d" },
      siblings     : [{ C: "e" }],
      children     : [],
      currentDepth : 4,
      currentIndex : 1,
      isRoot       : false,
      isLeaf       : true
    },
    {
      current      : { C: "f" },
      parent       : { FF: 4, C: "root" },
      siblings     : [{ C: "a" }, { C: "f" }],
      children     : [{ C: "g" }, { C: "j" }],
      currentDepth : 1,
      currentIndex : 2,
      isRoot       : false,
      isLeaf       : false
    },
    {
      current      : { C: "g" },
      parent       : { C: "f" },
      siblings     : [{ C: "g" }, { C: "j" }],
      children     : [{ C: "h" }],
      currentDepth : 2,
      currentIndex : 2,
      isRoot       : false,
      isLeaf       : false
    },
    {
      current      : { C: "h" },
      parent       : { C: "g" },
      siblings     : [{ C: "h" }],
      children     : [{ C: "i" }],
      currentDepth : 3,
      currentIndex : 2,
      isRoot       : false,
      isLeaf       : false
    },
    {
      current      : { C: "i" },
      parent       : { C: "h" },
      siblings     : [{ C: "i" }],
      children     : [],
      currentDepth : 4,
      currentIndex : 2,
      isRoot       : false,
      isLeaf       : true
    },
    {
      current      : { C: "j" },
      parent       : { C: "f" },
      children     : [],
      siblings     : [{ C: "g" }, { C: "j" }],
      currentDepth : 2,
      currentIndex : 3,
      isRoot       : false,
      isLeaf       : true
    }
  ];

  for ( i = 0; i < tests.length; i++ ) {
    name = "next to '" + (i !== 0 ? tests[i-1].current.C : "") + "'";

    t.equal( gameTree.hasNext(), true, name+": hasNext" );
    t.deepEqual( gameTree.peek(), tests[i].current, name+": peek" );
    t.deepEqual( gameTree.next(), tests[i].current, name+": next" );

    t.deepEqual(
      {
        current      : gameTree.getCurrent(),
        parent       : gameTree.getParent(),
        siblings     : gameTree.getSiblings(),
        children     : gameTree.getChildren(),
        currentDepth : gameTree.getCurrentDepth(),
        currentIndex : gameTree.getCurrentIndex(),
        isLeaf       : gameTree.isLeaf(),
        isRoot       : gameTree.isRoot()
      },
      tests[i],
      name
    );
  }

  t.equal( gameTree.hasNext(), false, "next to 'j': hasNext" );
  t.equal( gameTree.peek(), undefined, "next to 'j': peek" );
  t.equal( gameTree.next(), undefined, "next to 'j': next" );

  for ( i = tests.length-2; i >= 0; i-- ) {
    name = "previous to '" + tests[i+1].current.C + "'";

    t.equal( gameTree.hasPrevious(), true, name+": hasPrevious" );
    t.deepEqual( gameTree.lookBack(), tests[i].current, name+": lookBack" );
    t.deepEqual( gameTree.previous(), tests[i].current, name+": previous" );

    t.deepEqual(
      {
        current      : gameTree.getCurrent(),
        parent       : gameTree.getParent(),
        siblings     : gameTree.getSiblings(),
        children     : gameTree.getChildren(),
        currentDepth : gameTree.getCurrentDepth(),
        currentIndex : gameTree.getCurrentIndex(),
        isLeaf       : gameTree.isLeaf(),
        isRoot       : gameTree.isRoot()
      },
      tests[i],
      name
    );
  }

  t.equal( gameTree.hasPrevious(), false, "previous to 'root': hasPrevious" );
  t.equal( gameTree.lookBack(), undefined, "previous to 'root': lookBack" );
  t.equal( gameTree.previous(), undefined, "previous to 'root': previous" );

  t.end();
});

