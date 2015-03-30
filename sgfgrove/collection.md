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

#### collection = SGFGrove.collection( collectionArray )

Creates a new `SGFGrove.collection` object that inherits all methods from
`Array.prototype`. The collection array consists of
`SGFGrove.collection.gameTree` objects and behaves like a plain JavaScript
array, except that `slice`, `splice` and `concat` methods
return a new collection array instead of a plain JavaScript array,
and also `toString` method returns a SGF string instead of a comma-separated
string.

`collectionArray` denotes an array consisting of SGF game trees, where
a SGF game tree can be either a plain game tree array or
a `SGFGrove.collection.gameTree` object. The game tree array is coerced
into a `gameTree` object implicitly.

#### collection = SGFGrove.collection( text[, reviver] )

A shortcut for:

```js
SGFGrove.collection( SGFGrove.parse(text[, reviver]) );
```

### Attributes

None.

### Methods

#### newCollection = collection.create( text[, reviver] )
#### newCollection = collection.create( collectionArray )

Creates a new `SGFGrove.collection` object that inherits all methods from
the invocant.

#### gameTree = collection.createGameTree( gameTreeArray )

A factory method that creates a `SGFGrove.collection.gameTree` object.

#### sgfCollectionArray = collection.parse( text, reviver )

A shortcut for:

```js
SGFGrove.parse( text, reviver );
```

#### text = collection.toString( replacer, space )

A shortcut for:

```js
SGFGrove.stringify( collection, replacer, space );
```

#### newCollection = collection.clone()

Returns a deep copy of the invocant.

# SGFGrove.collection.gameTree

SGF game tree iterator/mutator

## Synopsis

## Description

### Constructor

#### gameTree = SGFGrove.collection.gameTree( gameTreeArray )

### Attributes

#### gameTreeArray = gameTree.tree

### Basic Methods

#### width = gameTree.getWidth()

#### height = gameTree.getHeight()

#### newGameTree = gameTree.clone()

#### gameTreeArray = gameTree.toJSON()

#### gameTreeArray = gameTree.toSGF()

### Iterator Methods

#### node = gameTree.getNode()

#### node = gameTree.getParent()

#### nodes = gameTree.getChildren()

#### nodes = gameTree.getSiblings()

#### bool = gameTree.isLeaf()

#### bool = gameTree.isRoot()

#### depth = gameTree.getDepth()

#### index = gameTree.getIndex()

#### self = gameTree.rewind()

#### node = gameTree.next()

#### bool = gameTree.hasNext()

#### node = gameTree.peek()

#### node = gameTree.previous();

#### node = gameTree.hasPrevious();

#### node = gameTree.lookBack();

#### node = gameTree.nextChild()

#### node = gameTree.hasNextChild()

#### node = gameTree.peekChild()

#### node = gameTree.previousChild()

#### node = gameTree.hasPreviousChild()

#### node = gameTree.lookBackChild()

### Mutator Methods

#### gameTree.setNode( node )

#### gameTree.insertChildAt( index | targetNode, node )

#### gameTree.insertChild( node )

#### gameTree.appendChild( node )

#### removedGameTree = gameTree.removeChildAt( index | targetNode )

#### removedGameTree = gameTree.removeChild()

#### removedGameTree = gameTree.replaceChildAt( index | targetNode, node )

#### removedGameTree = gameTree.replaceChild( node )

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

