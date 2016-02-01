(function () {
    "use strict";

    var SGFGrove;

    var collection = function () {
        var that = [];
        
        var factoryMethods = [
            "concat",
            "slice",
            "splice",
            "filter"
        ];

        var override = function (method) {
            var body = that[method];
            if (typeof body === "function") {
                that[method] = function () {
                    var that = this.create();
                    that.push.apply(that, body.apply(this, arguments));
                    return that;
                };
            }
        };

        for (var i = 0; i < factoryMethods.length; i++) {
            override(factoryMethods[i]);
        }

        that.create = function () {
            var that = [];

            for (var key in this) {
                if (this.hasOwnProperty(key) && /[^\d]/.test(key)) {
                    that[key] = this[key];
                }
            }

            that.initialize.apply(that, arguments);

            return that;
        };

        that.initialize = function (text, reviver) {
            var trees = this.parse(text || "", reviver);

            for (var i = 0; i < trees.length; i++) {
                this[i] = this.createGameTree(trees[i]);
            }

            return;
        };

        that.createGameTree = function (tree) {
            return collection.gameTree(tree);
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

        that.initialize.apply(that, arguments);

        return that;
    };

    collection.gameTree = function (tree, parent) {
        tree = tree || [[{}], []];

        var that, root;

        if (!parent) {
            that = collection.gameTree.node(tree[0][0]);
            root = that;
        }
        else {
            root = parent.root();
            that = root.create(tree[0][0], parent);
        }

        var node = that;
        for (var i = 1; i < tree[0].length; i++) {
            node = root.create(tree[0][i], node);
        }

        for (var j = 0; j < tree[1].length; j++) {
            collection.gameTree(tree[1][j], node);
        }

        return that;
    };

    collection.gameTree.node = function () {
        var that = {};

        collection.gameTree.node.serializable(that);
        collection.gameTree.node.mutable(that);
        collection.gameTree.node.cloneable(that);
        collection.gameTree.node.iterable(that);

        that.create = function () {
            var other = SGFGrove.Util.create(this);
            other.initialize.apply(other, arguments);
            return other;
        };

        that.initialize = function (properties, parent) {
            properties = properties || {};

            this.parent   = null;
            this.children = [];

            if (parent) {
                parent.appendChild(this);
            }

            this.setProperties(properties);

            return;
        };

        that.getProperties = function () {
            return this.properties;
        };

        that.setProperties = function (properties) {
            this.properties = properties;
            return;
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
         *  A node is its own sibling.
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
            var depth = 0;

            var node = this;
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
            var heights = [0];

            var children = this.getChildren();
            for (var i = 0; i < children.length; i++) {
                heights[i+1] = children[i].height()+1;
            }

            return Math.max.apply(null, heights);
        };

        /*
         *  Returns the index of the specified child in this node's child array.
         *  If the specified node is not a child of this node, returns -1.
         */
        that.childIndexOf = function (child) {
            var children = this.getChildren();
            for (var i = 0; i < children.length; i++) {
                if (children[i] === child) {
                    return i;
                }
            }
            return -1;
        };

        that.contains = function (other) {
            for (var node = other; node; node = node.getParent()) {
                if (node === this) {
                    return true;
                }
            }
            return false;
        };

        that.initialize.apply(that, arguments);

        return that;
    };

    collection.gameTree.node.serializable = function (that) {
        that = that || {};

        that.toSGF = function () {
            return [[this.getProperties()], this.getChildren()];
        };

        that.toString = function (replacer, space) {
            if (this.isRoot()) {
                return SGFGrove.stringify([this], replacer, space);
            }
            throw new Error("Not a root node");
        };

        that.toJSON = function () {
            var sequence = [this.getProperties()];

            var node = this;
            while (node.getChildCount() === 1) {
                node = node.firstChild();
                sequence.push(node.getProperties());
            }

            return [sequence, node.getChildren()];
        };

        return that;
    };

    collection.gameTree.node.mutable = function (that) {
        that = that || {};

        /*
         *  Private method to set the parent node for this node.
         *  This method cannot be invoked by client code.
         */
        var setParent = function (parent) {
            this.parent = parent;
            return parent;
        };

        /*
         *  Removes the given node from its parent (if it has a parent) and
         *  makes it a child of this node by adding it to the end of this
         *  nodes's array.
         */
        that.appendChild = function (child) {
            return this.insertChild(child, this.getChildCount());
        };

        /*
         *  Adds the child to this node's child array at the specified index
         *  and sets the child's parent to this node.
         *  The given child must not be an ancestor of this node.
         */
        that.insertChild = function (child, index) {
            child.removeFromParent();

            if (!SGFGrove.Util.isInteger(index)) {
                throw new Error("Not an integer");
            }
            else if (index < 0 || index > this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }
            else if (child.contains(this)) {
                throw new Error("Ancestor node given");
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
            if (!SGFGrove.Util.isInteger(index)) {
                throw new Error("Not an integer");
            }
            else if (index < 0 || index >= this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            var child = this.children.splice(index, 1)[0];
                setParent.call(child, null);

            return child;
        };

        that.removeFromParent = function () {
            if (!this.isRoot()) {
                var parent = this.getParent();
                parent.removeChild(parent.childIndexOf(this));
            }
        };

        return that;
    };

    collection.gameTree.node.cloneable = function (that) {
        that = that || {};

        that.clone = function (prototype) {
            var other = (prototype || this).create(this.cloneProperties());

            var children = this.getChildren();
            for (var i = 0; i < children.length; i++) {
                other.appendChild(children[i].clone(prototype || other));
            }

            return other;
        };

        that.cloneProperties = function (value) {
            value = !arguments.length ? this.getProperties() : value;

            var copy;
            if (!value || typeof value !== "object") {
                copy = value;
            }
            else if (typeof value.clone === "function") {
                copy = value.clone();
            }
            else if (SGFGrove.Util.isArray(value)) {
                copy = [];
                for (var i = 0; i < value.length; i++) {
                    copy[i] = this.cloneProperties(value[i]);
                }
            }
            else {
                copy = {};
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        copy[key] = this.cloneProperties(value[key]);
                    }
                }
            }

            return copy;
        };

        return that;
    };

    collection.gameTree.node.iterable = function (that) {
        that = that || {};

        that.forEach = function (callback, context) {
            var stack = [this];

            while (stack.length) {
                var node = stack.shift();
                stack = node.getChildren().concat(stack);
                callback.call(context, node);
            }

            return this;
        };

        /*
         *  Returns the node that follows this node in a preorder traversal
         *  of this node's tree. Returns undefined if this node is the last
         *  node of the traversal.
         */
        that.next = function () {
            if (!this.isLeaf()) {
                return this.firstChild();
            }

            for (var node = this; node; node = node.getParent()) {
                var sibling = node.nextSibling();
                if (sibling) {
                    return sibling;
                }
            }

            return;
        };

        /*
         *  Returns the node that precedes this node in a preorder traversal
         *  of this node's tree. Returns null if this node is the first node of
         *  the traversal, the root of the tree.
         */
        that.previous = function () {
            var node = this.previousSibling();

            if (!node) {
                return this.getParent();
            }

            while (!node.isLeaf()) {
                node = node.lastChild();
            }

            return node;
        };

        /*
         *  Returns the next sibling of this node in the parent's children
         *  array. Returns null if this node has no parent. Returns undefined
         *  if this node is the parent's last child.
         */
        that.nextSibling = function () {
            var parent = this.getParent();
            var index = parent && parent.childIndexOf(this);
            return parent ? parent.getChild(index+1) : null;
        };

        /*
         *  Returns the previous sibling of this node in the parent's children
         *  array. Returns null if this node has no parent. Returns undefined
         *  if this node is the parent's first child.
         */
        that.previousSibling = function () {
            var parent = this.getParent();
            var index = parent && parent.childIndexOf(this);
            return parent ? parent.getChild(index-1) : null;
        };

        return that;
    };

    if (typeof exports !== "undefined") {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
        module.exports = collection; // jshint ignore:line
    }
    else {
        SGFGrove = window.SGFGrove;
        SGFGrove.collection = collection;
    }

}());

