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

#### newGameTree = gameTree.clone()

#### gameTreeArray = gameTree.toJSON()

#### gameTreeArray = gameTree.toSGF()

### Iterator Methods

#### node = gameTree.getNode()

Returns the current node.

#### node = gameTree.getRoot()

Returns the root of `gameTree`.

#### leafCount = gameTree.getLeafCount()

Returns the total number of leaves that are descendants of the current node.
If the node is a leaf, returns `1`.

#### height = gameTree.getHeight()

Returns the longest distance from the current node to a leaf.
If the node has no children, returns `0`.

```js
if ( gameTree.isRoot() ) {
  gameTree.getHeight(); // => the height of gameTree
}
```

#### node = gameTree.getParent()

Returns the current node's parent or `null` if the node has no parent.

#### nodes = gameTree.getChildren()

Returns an array of children of the current node.
If the node has no children, returns an empty array.

#### nodes = gameTree.getChildCount()

Returns the number of children of the current node.

#### nodes = gameTree.getSiblings()

Returns an array of siblings of the current node.
A node is its own sibling. If it has no parent, returns `null`.

#### bool = gameTree.isLeaf()

Returns a Boolean value telling whether the current node has no children or not.

#### bool = gameTree.isRoot()

Returns a Boolean value telling whether the current node is the root of
`gameTree` or not.

#### depth = gameTree.getDepth()

Returns the distance from the root to the current node.
If the node is the root, returns `0`.

#### index = gameTree.getIndex()

#### index = gameTree.getChildIndexOf()

#### self = gameTree.rewind()

#### node = gameTree.next()

#### bool = gameTree.hasNext()

#### node = gameTree.peek()

#### node = gameTree.previous();

#### bool = gameTree.hasPrevious();

#### node = gameTree.lookBack();

### Mutator Methods

`target` can be the index of children of the current node or a target node
that will be compared to the children using the `===` operator.

`child` can be a node, `gameTreeArray` or `gameTree` object.

#### gameTree.setNode( node )

#### gameTree.insertChildAt( target, child )

#### gameTree.appendChild( child )

#### removedGameTree = gameTree.removeChildAt( target )

#### removedGameTree = gameTree.replaceChildAt( target, child )

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

