(function () {
    "use strict";

    var SGFGrove;

    if (typeof exports !== "undefined") {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
    }
    else {
        SGFGrove = window.SGFGrove;
    }

    SGFGrove.collection = function () {
        var that = [];
        
        var concat = that.concat,
            slice  = that.slice,
            splice = that.splice,
            filter = that.filter;

        that.create = function () {
            var that = [];

            for (var key in this) {
                if (this.hasOwnProperty(key) && /[^\d]/.test(key)) {
                    that[key] = this[key];
                }
            }

            that.init.apply(that, arguments);

            return that;
        };

        that.init = function () {
            if (typeof arguments[0] === "string") {
                var trees = this.parse(arguments[0], arguments[1]);
                for (var i = 0; i < trees.length; i++) {
                    this[i] = this.createGameTree(trees[i]);
                }
            }
            else {
                for (var j = 0; j < arguments.length; j++) {
                    this[i] = arguments[j];
                }
            }
        };

        that.createGameTree = function (tree) {
            return SGFGrove.collection.gameTree(tree);
        };

        that.parse = function (text, reviver) {
            return SGFGrove.parse(text, reviver);
        };

        that.toString = function (replacer, space) {
            return SGFGrove.stringify(this, replacer, space);
        };

        that.clone = function () {
            var clone = this.create();

            for (var i = 0; i < this.length; i++) {
                clone[i] = this[i].clone();
            }

            return clone;
        };

        that.slice = function () {
            return this.create(slice.apply(this, arguments));
        };

        that.splice = function () {
            return this.create(splice.apply(this, arguments));
        };

        that.concat = function () {
            return this.create(concat.apply(this, arguments));
        };

        if (typeof filter === "function") {
            that.filter = function () {
                return this.create(filter.apply(this, arguments));
            };
        }

        that.init.apply(that, arguments);

        return that;
    };

    SGFGrove.collection.gameTree = function () {
        var that = SGFGrove.collection.gameTree.node.apply(null, arguments);

        return that;
    };

    SGFGrove.collection.gameTree.node = function () {
        var that = {};

        that.create = function () {
            var that = SGFGrove.Util.create(this.root());
            that.init.apply(that, arguments);
            return that;
        };

        that.init = function (tree) {
            tree = tree || [[{}], []];

            this.node     = this.createNode(tree[0][0]);
            this.parent   = null;
            this.children = [];

            var node = this;
            for (var i = 1; i < tree[0].length; i++) {
                var child = this.create([[tree[0][i]], []]);
                node.appendChild(child);
                node = child;
            }

            for (var j = 0; j < tree[1].length; j++) {
                node.appendChild(this.create(tree[1][j]));
            }

            return;
        };

        that.createNode = function (node) {
            return node;
        };

        that.getNode = function () {
            return this.node;
        };

        that.setNode = function (node) {
            this.node = node;
            return node;
        };

        /*
         *  Returns this node's parent or null if this node has no parent.
         */
        that.getParent = function () {
            return this.parent;
        };

        that.getChildren = function () {
            return this.children.slice(0);
        };

        /*
         *  Returns the number of children of this node.
         */
        that.getChildCount = function () {
            return this.children.length;
        };

        /*
         *  Returns the child at the specified index in this node's child
         *  array.
         */
        that.getChild = function (index) {
            return this.children[index];
        };

        /*
         *  Returns this node's first child. If this node has no children,
         *  returns undefined.
         */
        that.firstChild = function () {
            return this.getChild(0);
        };

        /*
         *  Returns this node's last child. If this node has no children,
         *  returns undefined.
         */
        that.lastChild = function () {
            return this.getChild(Math.max(0, this.getChildCount()-1));
        };

        /*
         *  Returns true if this node is the root of the tree.
         */
        that.isRoot = function () {
            return this.getParent() === null;
        };

        /*
         *  Returns true if this node has no children.
         */
        that.isLeaf = function () {
            return this.getChildCount() === 0;
        };

        /*
         *  Returns the root of the tree that contains this node.
         *  The root is the ancestor with a null parent.
         */
        that.root = function () {
            var root = this;

            while (!root.isRoot()) {
                root = root.getParent();
            }

            return root;
        };

        /*
         *  Return an array of siblings for this node.
         *  This node is included.
         */
        that.siblings = function () {
            return !this.isRoot() ? this.getParent().getChildren() : null;
        };

        /*
         *  Returns the depth of this node in its tree. The depth of a node
         *  is defined as the length of the node's path to its root.
         *  The depth of a root node is zero.
         */
        that.depth = function () {
            var node = this;
            var depth = 0;

            while (!node.isRoot()) {
                node = node.getParent();
                depth += 1;
            }

            return depth;
        };

        /*
         *  Returns the height of the (sub)tree from this node.
         *  The height of a node is defined as the length of the longest
         *  downward path to a leaf from the node.
         *  The height from a root node is the height of the entire tree.
         *  The height of a leaf node is zero.
         */
        that.height = function () {
            var children = this.getChildren();
            var heights = [0];

            for (var i = 0; i < children.length; i++) {
                heights[i+1] = children[i].height()+1;
            }

            return Math.max.apply(null, heights);
        };

        /*
         *  Returns the index of this tree within its sibling list.
         *  Returns -1 if the tree is the root.
         */
        that.index = function () {
            var index = -1;

            if (!this.isRoot()) {
                var siblings = this.getParent().getChildren();
                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i] === this) {
                        index = i;
                        break;
                    }
                }
            }

            return index;
        };

        SGFGrove.collection.gameTree.node.serializable(that);
        SGFGrove.collection.gameTree.node.mutable(that);
        SGFGrove.collection.gameTree.node.cloneable(that);
        SGFGrove.collection.gameTree.node.iterable(that);
        SGFGrove.collection.gameTree.node.visitor(that);

        that.init.apply(that, arguments);

        return that;
    };

    SGFGrove.collection.gameTree.node.serializable = function (that) {
        that = that || {};

        that.createCollection = function () {
            return SGFGrove.collection.apply(null, arguments);
        };

        that.toSGF = function () {
            var node = this;
            var sequence = [node.getNode()];

            while (node.getChildCount() === 1) {
                node = node.firstChild();
                sequence.push(node.getNode());
            }

            return [sequence, node.getChildren()];
        };

        that.toJSON = that.toSGF;

        that.toCollection = function () {
            if (this.isRoot()) {
                return this.createCollection(this);
            }
            throw new Error("Not a root node");
        };

        that.toString = function (replacer, space) {
            return this.toCollection().toString(replacer, space);
        };

        return that;
    };

    SGFGrove.collection.gameTree.node.mutable = function (that) {
        that = that || {};

        var isInteger = SGFGrove.Util.isInteger;

        /*
         *  Private method to set the parent node for this node.
         *  This method cannot be invoked by client code.
         */
        var setParent = function (parent) {
            this.parent = parent;
            return parent;
        };

        /*
         *  Adds the child to the end of this node's child array.
         */
        that.appendChild = function (child) {
            return this.insertChild(this.getChildCount(), child);
        };

        /*
         *  Adds the child to this node's child array at the specified index
         *  and sets the child's parent to this node.
         */
        that.insertChild = function (index, child) {
            index = isInteger(index) ? index : index.index();

            if (index < 0 || index > this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            if (!child.isRoot()) {
                throw new Error("Not a root node");
            }

            this.children.splice(index, 0, child);
            setParent.call(child, this);

            return;
        };

        /*
         *  Removes the child at the specified index from this node's children
         *  and sets that node's parent to null.
         */
        that.removeChild = function (index) {
            index = isInteger(index) ? index : index.index();

            if (index < 0 || index >= this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            var child = this.children.splice(index, 1)[0];
                setParent.call(child, null);

            return child;
        };

        /*
         *  Replaces the specified child node with another node
         *  on this node.
         */
        that.replace = function (index, other) {
            index = isInteger(index) ? index : index.index();
            var child = this.removeChild(index);
            this.insertChild(index, other);
            return child;
        };

        return that;
    };

    SGFGrove.collection.gameTree.node.cloneable = function (that) {
        that = that || {};

        that.clone = function () {
            var clone = this.create([[this.cloneNode()], []]);

            var children = this.getChildren();
            for (var i = 0; i < children.length; i++) {
                clone.appendChild(children[i].clone());
            }

            return clone;
        };

        that.cloneNode = function () {
            var node = !arguments.length ? this.getNode() : arguments[0];

            var clone;
            if (!node || typeof node !== "object") {
                clone = node;
            }
            else if (typeof node.clone === "function") {
                clone = node.clone();
            }
            else if (SGFGrove.Util.isArray(node)) {
                clone = [];
                for (var i = 0; i < node.length; i++) {
                    clone[i] = this.cloneNode(node[i]);
                }
            }
            else {
                clone = {};
                for (var key in node) {
                    if (node.hasOwnProperty(key)) {
                        clone[key] = this.cloneNode(node[key]);
                    }
                }
            }

            return clone;
        };

        return that;
    };

    SGFGrove.collection.gameTree.node.iterable = function (that) {
        that = that || {};

        /*
         *  Returns the node that follows this node in a depth-first traversal
         *  of this node's tree. Returns undefined if this node is the last
         *  node of the traversal.
         */
        that.next = function () {
            var next;

            if (!this.isLeaf()) {
                next = this.firstChild();
            }
            else {
                var node = this;
                while (!next && node) {
                    next = node.nextSibling();
                    node = node.getParent();
                }
            }

            return next;
        };

        /*
         *  Returns the node that precedes this node in a depth-first traversal
         *  of this node's tree. Returns null if this node is the first node of
         *  the traversal, the root of the tree.
         */
        that.previous = function () {
            var previous = this.previousSibling();

            if (!previous) {
                previous = this.getParent();
            }
            else {
                while (!previous.isLeaf()) {
                    previous = previous.lastChild();
                }
            }

            return previous;
        };

        /*
         *  Returns the next sibling of this node in the parent's children
         *  array. Returns null if this node has no parent. Returns undefined
         *  if this node is the parent's last child.
         */
        that.nextSibling = function () {
            var index = this.index();
            var next;

            if (index < 0) {
                next = null;
            }
            else {
                var parent = this.getParent();
                if (index+1 < parent.getChildCount()) {
                    next = parent.getChild(index+1);
                }
            }

            return next;
        };

        /*
         *  Returns the previous sibling of this node in the parent's children
         *  array. Returns null if this node has no parent. Returns undefined
         *  if this node is the parent's first child.
         */
        that.previousSibling = function () {
            var index = this.index();
            var previous;

            if (index < 0) {
                previous = null;
            }
            else if (index-1 >= 0) {
                previous = this.getParent().getChild(index-1);
            }

            return previous;
        };

        that.toIterator = function () {
            return SGFGrove.collection.gameTree.node.iterable.iterator(this);
        };

        that.forEach = function (callback, context) {
            var iterator = this.toIterator();

            while (iterator.hasNext()) {
                callback.call(context, iterator.next());
            }

            return this;
        };

        if (typeof Symbol === "function" &&
            typeof Symbol.iterator === "symbol") {
            that[Symbol.iterator] = function () {
                var iterator = this.toIterator();
                var next = iterator.next;

                iterator.next = function () {
                    if (this.hasNext()) {
                        return { value: next.call(this) };
                    }
                    else {
                        return { done: true };
                    }
                };

                return iterator;
            };
        }

        return that;
    };

    SGFGrove.collection.gameTree.node.iterable.iterator = function (node) {
        var that = [node];

        that.next = function () {
            var next;

            if (this.length) {
                next = this.shift();
                this.unshift.apply(this, next.getChildren());
            }

            return next;
        };

        that.hasNext = function () {
            return this.length;
        };

        that.peek = function () {
            return this[0];
        };

        return that;
    };

    SGFGrove.collection.gameTree.node.visitor = function (that) {
        that = that || {};

        /*
         *  Returns the total number of leaves that are descendants of this 
         *  node. If this node is a leaf, returns 1.
         */
        that.leafCount = function () {
            var children = this.getChildren();
            var sum = 0;

            for (var i = 0; i < children.length; i++) {
                sum += children[i].leafCount();
            }

            return sum || 1;
        };

        that.mainLine = function () {
            var node = this.root();
            var mainLine = [node];

            while (!node.isLeaf()) {
                node = node.firstChild();
                mainLine.push(node);
            }

            return mainLine;
        };

        /*
         *  Returns an array of nodes giving the path from the root
         *  to this node, where the first item in the array is the root
         *  and the last item is this node.
         */
        that.path = function () {
            return this.pathToRoot().reverse();
        };

        that.pathToRoot = function () {
            var node = this;
            var path = [node];

            while (!node.isRoot()) {
                node = node.getParent();
                path.push(node);
            }

            return path;
        };

        return that;
    };

}());

