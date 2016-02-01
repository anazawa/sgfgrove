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

collection[0]; // => gameTree
collection[0] = gameTree;

collection.length; // => 1

collection.pop(); // => gameTree
collection.push(gameTree, ...);

collection.shift(); // => gameTree
collection.unshift(gameTree, ...);

collection.concat(gameTree, anotherCollection, ...); // => newCollection
collection.splice(2, 1, gameTree1, gameTree2, ...); // => newCollection
collection.slice(0, 10); // => newCollection

collection.toString(); // => "(;FF[4])"
""+collection; // => "(;FF[4])"

for ( var i = 0; i < collection.length; i++ ) {
  // do something with collection[i]
}
```

## Description

### Constructor

#### collection = SGFGrove.collection(text[, reviver])

Given a SGF string, creates a new `SGFGrove.collection` object that inherits
all methods from `Array`.
The collection object behaves like a plain JavaScript array,
except that `slice`, `splice`, `concat` and `filter` (if it exists) methods
return a new `SGFGrove.collection` object instead of a plain JavaScript array,
and also `toString` method returns a SGF string instead of a comma-separated
string.

### Attributes

None.

### Methods

#### newCollection = collection.create(text[, reviver])

Creates a new `SGFGrove.collection` object that inherits all methods from
the invocant.

#### gameTree = collection.createGameTree(gameTreeArray)

A factory method that creates a new `SGFGrove.collection.gameTree` object.

#### collectionArray = collection.parse(text[, reviver])

A shortcut for:

```js
SGFGrove.parse(text, reviver);
```

#### text = collection.toString([replacer[, space]])

A shortcut for:

```js
SGFGrove.stringify(collection, replacer, space);
```

#### newCollection = collection.clone()

Returns a deep copy of the invocant.

# SGFGrove.collection.gameTree

Object represents a SGF game tree

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
<script src="sgfgrove/collection.js"></script>
```

In your JavaScript:

```js
var gameTree = SGFGrove.collection.gameTree([
    [{
        FF: 4,
        C: "root"
    }],
    []
]);

gameTree.isRoot(); // => true
```

## Description

Given a SGF game tree array, creates a new `SGFGrove.collection.gameTree`
object that inherits all methods from `SGFGrove.collection.gameTree.node`.
Returns the root node of the game tree.

All the descendant nodes of the root node inherit from the root:

```js
// Add foo method that can be invoked by all the descendant nodes
gameTree.foo = function () {
    return "bar";
};

gameTree.firstChild().foo(); // => "bar"
gameTree.firstChild().firstChild().foo(); // => "bar"
```

# SGFGrove.collection.gameTree.node

Object represents a SGF node

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
<script src="sgfgrove/collection.js"></script>
```

In your JavaScript:

```js
var node = SGFGrove.collection.gameTree.node({
    FF: 4,
    C: "root"
});

node.getProperties(); // => { FF: 4, C: "root" }
node.setProperties({ FF: 4 });

node.getParent(); // => parentNode
node.getChildren(); // => [child1, child2, ...]
node.getChild(0); // => childNode
node.firstChild(); // => firstChildNode
node.lastChild(); // => lastChildNode

node.isRoot(); // => true or false
node.isLeaf(); // => true or false
node.contains(otherNode); // => true or false

node.next(); // => nextNode
node.previous(); // => previousNode
node.nextSibling(); // => nextSibling
node.previousSibling(); // => previousSibling

var id = 0;
node.forEach(function (n) {
    n.id = id++;
});

var newNode = node.create({
    B: "pd"
});

node.appendChild(newNode);
node.insertChild(newNode, 2);
node.removeChild(2); // => removedNode
node.removeFromParent();
```

## Description

### Constructor

#### node = SGFGrove.collection.gameTree.node([properties[, parent]])

Creates a new `SGFGrove.collection.gameTree.node` object.
`properties` represents SGF properties this `node` contains
and defaults to an empty object (`{}`).
If `parent` node is provided, adds this `node` to the end of `parent`'s
child array.

### Attributes

#### object = node.getProperties()

#### node.setProperties(object)

Gets or sets an object that containts SGF properties.

#### arrayOfNodes = node.getChildren()

Returns an array of children of the current node.
If the node has no children, returns an empty array.

#### parentNode = node.getParent()

Returns this node's parent or `null` if this node has no parent.

### Accessor Methods

#### newNode = node.create(object)

Given an object that contains SGF properties, creates a new
`SGFGrove.collection.gameTree.node` object that inherits all methods from
the invocant. 

#### integer = node.getChildCount()

Returns the number of children of this node.

#### childNode = node.getChild(index)

Returns the child at the specified `index` in this node's child array.

#### childNode = node.firstChild()

Returns this node's first child. If this node has no children,
returns `undefined`.

#### childNode = node.lastChild()

Returns this node's last child. If this node has no children,
returns `undefined`.

#### arrayOfNodes = node.siblings()

Return an array of siblings for this node.
A node is its own sibling.
If it has no parent, returns `null`.

#### rootNode = node.root()

Returns the root of the tree that contains this node.
The root is the ancestor with a `null` parent.

#### integer = node.height()

Returns the height of the (sub)tree from this node.
The height of a node is defined as the length of the longest
downward path to a leaf from the node.
The height from a root node is the height of the entire tree.
The height of a leaf node is `0`.
 
#### integer = node.depth()

Returns the depth of this node in its tree. The depth of a node
is defined as the length of the node's path to its root.
The depth of a root node is `0`.

#### string = node.toString(replacer, space)

Returns a SGF representation of `node`.
`node` must be a root.

#### integer = node.childIndexOf(otherNode)

Returns the index of `otherNode` in this node's child array.
If the specified node is not a child of this node, returns `-1`.

### Predicate Methods

#### boolean = node.isLeaf()

Returns `true` if this node has no children.

#### boolean = node.isRoot()

Returns `true` if this node is the root of the tree.

#### boolean = node.contains(otherNode)

Returns `true` if `otherNode` is a descendant of this node.
A node is considered a descendant of itself.

### Iterator Methods

#### self = node.forEach(callback[, context])

```js
var leafCount = 0;
node.forEach(function (n) {
    if (n.isLeaf()) {
        leafCount += 1;
    }
});
```

#### nextNode = node.next()

Returns the node that follows this node in a preorder traversal
of this node's tree. Returns `undefined` if this node is the last
node of the traversal.

#### previousNode = node.previous()

Returns the node that precedes this node in a preorder traversal
of this node's tree. Returns `null` if this node is the first node of
the traversal, the root of the tree.

#### nextSibling = node.nextSibling()

Returns the next sibling of this node in the parent's children
array. Returns `null` if this node has no parent. Returns `undefined`
if this node is the parent's last child.

#### previousSibling = node.previousSibling()

Returns the previous sibling of this node in the parent's children
array. Returns `null` if this node has no parent. Returns `undefined`
if this node is the parent's first child.

### Cloning Methods

#### newNode = node.clone()

Returns a deep copy of the invocant.

### Mutator Methods

#### node.appendChild(child)

Removes the given node from its parent (if it has a parent) and
makes it a child of this node by adding it to the end of this
nodes's child array.

#### node.insertChild(child, index)

Adds the child to this node's child array at the specified `index`
and sets the child's parent to this node.
The given child must not be an ancestor of this node.

#### removedNode = node.removeChild(index)

Removes the child at the specified `index` from this node's children
and sets that node's parent to null.

#### node.removeFromParent()

Removes the subtree rooted at this node from the tree,
giving this node a `null` parent.

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

