var test = require("tape");
var SGF = require("../sgfgrove.js");

require("../sgfgrove/collection.js");

test("SGFGrove.collection: default", function (t) {
  var collection = SGF.collection();

  t.ok( typeof collection.create === "function" );
  t.ok( typeof collection.parse === "function" );

  t.equal( collection.length, 1 );

  t.end();
});

test("SGFGrove.collection: #create", function (t) {
  var collection = SGF.collection();
      collection.foo = function () { return "bar"; };

  var newCollection = collection.create();

  t.equal( typeof newCollection.create, "function" );
  t.equal( newCollection.foo, collection.foo );
  t.notEqual( newCollection[0], collection[0] );

  t.end();
});

test("SGFGrove.collection: #toString", function (t) {
  var collection = SGF.collection();

  t.ok( /^\(;/.test(collection.toString()) );
  t.ok( /^\(;/.test(""+collection) );

  t.end();
});

test("SGFGrove.collection: #slice", function (t) {
  var gameTree1 = SGF.collection.gameTree(),
      gameTree2 = SGF.collection.gameTree();

  var collection1 = SGF.collection([ gameTree1, gameTree2 ]),
      collection2 = collection1.slice( 0, 1 );

  t.equal( typeof collection2.create, "function" );
  t.equal( collection2.length, 1 );
  t.equal( collection2[0], gameTree1 );

  t.end();
});

test("SGFGrove.collection: #concat", function (t) {
  var gameTree1 = SGF.collection.gameTree(),
      gameTree2 = SGF.collection.gameTree(),
      gameTree3 = SGF.collection.gameTree();

  var collection1 = SGF.collection([ gameTree1 ]),
      collection2 = SGF.collection([ gameTree2 ]),
      collection3 = collection1.concat( collection2, gameTree3 );

  t.equal( typeof collection3.create, "function" );
  t.equal( collection3.length, 3 );
  t.equal( collection3[0], gameTree1 );
  t.equal( collection3[1], gameTree2 );
  t.equal( collection3[2], gameTree3 );

  t.end();
});

