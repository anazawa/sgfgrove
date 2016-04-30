# SGFGrove.gameTree

Object represents a SGF game tree

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
<script src="sgfgrove/gametree.js"></script>
```

In your JavaScript:

```js
var gameTree = SGFGrove.gameTree([
    [{
        FF: 4,
        C: "root"
    }],
    []
]);

gameTree.isRoot(); // => true
```

## Description

Given a SGF game tree array, creates a new `SGFGrove.gameTree`
object that inherits all methods from `SGFGrove.gameTree.node`.
Returns the root node of the game tree.

All the descendant nodes of the root node inherit from the root:

```js
// Add foo method that can be invoked by all the descendant nodes
gameTree.foo = function () {
    return "bar";
};

gameTree.children()[0].foo(); // => "bar"
gameTree.children()[0].children()[0].foo(); // => "bar"
```

# SGFGrove.gameTree.node

Object represents a SGF node

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
<script src="sgfgrove/gametree.js"></script>
```

In your JavaScript:

```js
var node = SGFGrove.gameTree.node({
    FF: 4,
    C: "root"
});

node.properties(); // => { FF: 4, C: "root" }
node.properties({ FF: 4 }); // => node

node.parent(); // => parentNode
node.children(); // => [child1, child2, ...]

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

// jQuery-like methods
node.append(newNode);
node.prepend(newNode);
node.detach();
node.empty();
node.replaceWith(newNode);
```

## Description

### Constructor

#### node = SGFGrove.gameTree.node([properties[, parent]])

Creates a new `SGFGrove.gameTree.node` object.
`properties` represents SGF properties of this `node`
and defaults to an empty object (`{}`).
If `parent` node is provided, adds this `node` to the end of `parent`'s
child array.

#### newNode = node.create(properties)

Given an object that contains SGF properties, creates a new
`SGFGrove.gameTree.node` object that inherits all methods from
the invocant. 

### Attributes

#### properties = node.properties()

#### self = node.properties(properties)

Gets or sets an object that represents SGF properties of this node.

#### arrayOfNodes = node.children()

Returns an array of children of this node.
If the node has no children, returns an empty array.

#### parentNode = node.parent()

Returns this node's parent or `null` if this node has no parent.

### Accessor Methods

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

#### integer = node.indexOf(otherNode)

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

#### self = node.forEach(preorderCallback, postorderCallback, context)

Executes the provided `callback` once for each node (including this node)
of the (sub)tree rooted at this node in depth-first order.

```js
var leafCount = 0;
node.forEach(function (n) {
    if (n.isLeaf()) {
        leafCount += 1;
    }
});
```

#### nextNode = node.next()

Returns the node that follows this node in a pre-order traversal
of this node's tree. Returns `undefined` if this node is the last
node of the traversal.

#### previousNode = node.previous()

Returns the node that precedes this node in a pre-order traversal
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

#### node.append(otherNode)

Removes the given node from its parent (if it has a parent) and
makes it a child of this node by adding it to the end of this
nodes's child array.

#### node.prepend(otherNode)

#### node.detach()

Removes the subtree rooted at this node from the tree,
giving this node a `null` parent.

#### node.empty()

#### node.replaceWith(otherNode)

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

