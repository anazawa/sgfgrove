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

  var data = [
    {
      node     : { FF: 4, C: "root" },
      parent   : null,
      siblings : null,
      children : [{ C: "a" }, { C: "f" }],
      child    : { C: "a" },
      depth    : 0,
      index    : 0,
      isRoot   : true,
      isLeaf   : false
    },
    {
      node     : { C: "a" },
      parent   : { FF: 4, C: "root" },
      siblings : [{ C: "a" }, { C: "f" }],
      children : [{ C: "b" }],
      child    : { C: "b" },
      depth    : 1,
      index    : 0,
      isRoot   : false,
      isLeaf   : false
    },
    {
      node     : { C: "b" },
      parent   : { C: "a" },
      siblings : [{ C: "b" }],
      children : [{ C: "c" }, { C: "d" }],
      child    : { C: "c" },
      depth    : 2,
      index    : 0,
      isRoot   : false,
      isLeaf   : false
    },
    {
      node     : { C: "c" },
      parent   : { C: "b" },
      siblings : [{ C: "c" }, { C: "d" }],
      children : [],
      child    : null,
      depth    : 3,
      index    : 0,
      isRoot   : false,
      isLeaf   : true
    },
    {
      node     : { C: "d" },
      parent   : { C: "b" },
      siblings : [{ C: "c" }, { C: "d" }],
      children : [{ C: "e" }],
      child    : { C: "e" },
      depth    : 3,
      index    : 1,
      isRoot   : false,
      isLeaf   : false
    },
    {
      node     : { C: "e" },
      parent   : { C: "d" },
      siblings : [{ C: "e" }],
      children : [],
      child    : null,
      depth    : 4,
      index    : 1,
      isRoot   : false,
      isLeaf   : true
    },
    {
      node     : { C: "f" },
      parent   : { FF: 4, C: "root" },
      siblings : [{ C: "a" }, { C: "f" }],
      children : [{ C: "g" }, { C: "j" }],
      child    : { C: "g" },
      depth    : 1,
      index    : 2,
      isRoot   : false,
      isLeaf   : false
    },
    {
      node     : { C: "g" },
      parent   : { C: "f" },
      siblings : [{ C: "g" }, { C: "j" }],
      children : [{ C: "h" }],
      child    : { C: "h" },
      depth    : 2,
      index    : 2,
      isRoot   : false,
      isLeaf   : false
    },
    {
      node     : { C: "h" },
      parent   : { C: "g" },
      siblings : [{ C: "h" }],
      children : [{ C: "i" }],
      child    : { C: "i" },
      depth    : 3,
      index    : 2,
      isRoot   : false,
      isLeaf   : false
    },
    {
      node     : { C: "i" },
      parent   : { C: "h" },
      siblings : [{ C: "i" }],
      children : [],
      child    : null,
      depth    : 4,
      index    : 2,
      isRoot   : false,
      isLeaf   : true
    },
    {
      node     : { C: "j" },
      parent   : { C: "f" },
      children : [],
      child    : null,
      siblings : [{ C: "g" }, { C: "j" }],
      depth    : 2,
      index    : 3,
      isRoot   : false,
      isLeaf   : true
    }
  ];

  var testState = function (d, n) {
    t.deepEqual( gameTree.getNode(),     d.node,     n+": #getNode"     );
    t.deepEqual( gameTree.getParent(),   d.parent,   n+": #getParent"   );
    t.deepEqual( gameTree.getSiblings(), d.siblings, n+": #getSiblings" );
    t.deepEqual( gameTree.getChildren(), d.children, n+": #getChildren" );
    t.deepEqual( gameTree.getChild(),    d.child,    n+": #getChild"    );
        t.equal( gameTree.getDepth(),    d.depth,    n+": #getDepth"    );
        t.equal( gameTree.getIndex(),    d.index,    n+": #getIndex"    );
        t.equal( gameTree.isLeaf(),      d.isLeaf,   n+": #isLeaf"      );
        t.equal( gameTree.isRoot(),      d.isRoot,   n+": #isRoot"      );
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

