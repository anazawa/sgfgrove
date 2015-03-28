# SGFGrove.collection

Object represents a SGF collection

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
<script src="sgfgrove/collection.js"></script>
```

In your JavaScript:

```js
var collection = SGFGrove.collection("(;FF[4])");
// or
var collection = SGFGrove.collection("(;FF[4])", function (key, value) {...});
// or
var collection = SGFGrove.collection([ [[{ FF: 4 }], []], ...  ]);
// or
var collection = SGFGrove.collection([ SGFGrove.collection.gameTree(...), ... ])

collection[0]; // => gameTree
collection[0] = gameTree;

collection.length; // => 1

collection.push( gameTree, ... );
collection.pop(); // => gameTree

collection.unshift( gameTree, ... );
collection.shift(); // => gameTree

collection.concat( gameTree, anotherCollection, ... ); // => newCollection
collection.splice( 2, 1, gameTree1, gameTree2, ... ); // => newCollection
collection.slice( 0, 10 ); // => newCollection

collection.toString(); // => "(;FF[4])"
""+collection; // => "(;FF[4])"

for ( var i = 0; i < collection.length; i++ ) {
  // do something with collection[i]
}
```

## Description

### Constructor

#### collection = SGFGrove.collection( sgfCollectionArray )

Creates a new `SGFGrove.collection` object that inherits all methods from
`Array.prototype`. The collection array consists of
`SGFGrove.collection.gameTree` objects and behaves like a plain JavaScript
array, except that `slice`, `splice` and `concat` methods
return a new collection array instead of a plain JavaScript array,
and also `toString` method returns a SGF string instead of a comma-separated
string.

`sgfCollectionArray` denotes an array consisting of SGF game trees, where
a SGF game tree can be either a plain game tree array or
a `SGFGrove.collection.gameTree` object. The plain game tree array is coerced
into a `SGFGrove.collection.gameTree` object implicitly.

#### collection = SGFGrove.collection( sgfString[, reviver] )

A shortcut for:

```js
SGFGrove.collection( SGFGrove.parse(sgfString[, reviver]) );
```

### Attributes

None.

### Methods

#### newCollection = collection.create( sgfString[, reviver] )
#### newCollection = collection.create( sgfCollectionArray )

Creates a new `SGFGrove.collection` object that inherits all methods from
the invocant.

#### gameTree = collection.createGameTree( sgfGameTreeArray )

A factory method that creates a `SGFGrove.collection.gameTree` object.

#### sgfCollectionArray = collection.parse( sgfString, reviver )

A shortcut for:

```js
SGFGrove.parse( sgfString, reviver );
```

#### sgfString = collection.toString(replacer, space)

A shortcut for:

```js
SGFGrove.stringify( collection, replacer, space );
```

#### newCollection = collection.clone()

Returns a deep copy of the invocant.

# SGFGrove.collection.gameTree

SGF game tree iterator/manipulator

## Synopsis

## Description

### Constructor

#### gameTree = SGFGrove.collection.gameTree( sgfGameTreeArray )

### Attributes

### Methods

#### width = gameTree.getWidth()

#### height = gameTree.getHeight()

#### node = gameTree.getParent()

#### nodes = gameTree.getChildren()

#### nodes = gameTree.getSiblings()

#### bool = gameTree.isLeaf()

#### bool = gameTree.isRoot()

#### node = gameTree.next()

#### bool = gameTree.hasNext()

#### node = gameTree.peek()

#### node = gameTree.getNode()

#### gameTree.setNode( node )

#### depth = gameTree.getDepth()

#### node = gameTree.nextChild()

#### index = gameTree.getIndex()

#### gameTree.insertChildAt( index | targetNode, node )

#### gameTree.insertChild( node  )

#### removedGameTree = gameTree.removeChildAt( index|targetNode )

#### removedGameTree = gameTree.removeChild()

#### removedGameTree = gameTree.replaceChildAt( index | targetNode, node )

#### removedGameTree = gameTree.replaceChild( node  )

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

