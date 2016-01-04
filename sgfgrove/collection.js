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
            splice = that.splice;

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

        that.init = function (trees, reviver) {
            trees = typeof trees === "string" && this.parse(trees, reviver);
            trees = trees || [];

            for (var i = 0; i < trees.length; i++) {
                if (trees[i] && typeof trees[i] === "object" &&
                    typeof trees[i].clone === "function" &&
                    typeof trees[i].toSGF === "function") {
                    this[i] = trees[i];
                }
                else {
                    this[i] = this.createGameTree(trees[i]);
                }
            }

            return;
        };

        that.createGameTree = function (tree, parent) {
            return SGFGrove.collection.gameTree(tree, parent);
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

        that.init.apply(that, arguments);

        return that;
    };

    SGFGrove.collection.gameTree = function () {
        var that = {};

        that.create = function () {
            var that = SGFGrove.Util.create(this.getRoot());
            that.init.apply(that, arguments);
            return that;
        };

        that.init = function (tree, parent) {
            tree = tree || [[{}], []];

            this.node     = tree[0][0];
            this.parent   = parent || null;
            this.children = [];

            parent = this;
            for (var i = 1; i < tree[0].length; i++) {
                var child = this.create([[tree[0][i]], []]);
                parent.addChild(child);
                parent = child;
            }

            for (var j = 0; j < tree[1].length; j++) {
                parent.addChild(this.create(tree[1][j]));
            }

            return;
        };

        that.getParent = function () {
            return this.parent;
        };

        that.getChildren = function () {
            return this.children.slice(0);
        };

        that.getChildCount = function () {
            return this.children.length;
        };

        that.getChild = function (index) {
            return this.children[index];
        };

        that.getSiblings = function () {
            return !this.isRoot() ? this.getParent().getChildren() : null;
        };

        that.getSibling = function (index) {
            return !this.isRoot() ? this.getParent().getChild(index) : null;
        };

        that.getRoot = function () {
            var root = this;

            while (!root.isRoot()) {
                root = root.getParent();
            }

            return root;
        };

        that.isRoot = function () {
            return this.getParent() === null;
        };

        that.isLeaf = function () {
            return this.getChildCount() === 0;
        };

        that.clone = function () {
            var clone = this.create([[this.cloneNode()], []]);

            for (var i = 0; i < this.getChildCount(); i++) {
                clone.addChild(this.getChild(i).clone());
            }

            return clone;
        };

        that.cloneNode = function () {
            var node = !arguments.length ? this.node : arguments[0];
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

        that.toSGF = function () {
            var gameTree = this;
            var sequence = [gameTree.node];

            while (gameTree.getChildCount() === 1) {
                gameTree = gameTree.getChild(0);
                sequence.push(gameTree.node);
            }

            return [sequence, gameTree.getChildren()];
        };

        that.toJSON = function () {
            return this.toSGF();
        };

        SGFGrove.collection.gameTree.node(that);
        SGFGrove.collection.gameTree.metrics(that);
        SGFGrove.collection.gameTree.mutable(that);
        SGFGrove.collection.gameTree.iterable(that);
        SGFGrove.collection.gameTree.visitor(that);

        that.init.apply(that, arguments);

        return that;
    };

    SGFGrove.collection.gameTree.node = function (that) {
        that = that || {};

        that.get = function (key) {
            return this.node[key];
        };

        that.has = function (key) {
            return this.node.hasOwnProperty(key);
        };

        that.set = function (key, value) {
            this.node[key] = value;
            return value;
        };

        that.remove = function (key) {
            var value = this.get(key);
            delete this.node[key];
            return value;
        };

        that.extend = function (other) {
            for (var key in other) {
                if (other.hasOwnProperty(key)) {
                    this.set(key, other[key]);
                }
            }
            return this;
        };

        that.forEach = function (iterator, context) {
            for (var key in this.node) {
                if (this.node.hasOwnProperty(key)) {
                    iterator.call(context, this.get(key), key);
                }
            }
            return this;
        };

        return that;
    };

    SGFGrove.collection.gameTree.metrics = function (that) {
        that = that || {};

        /*
         *  Returns the index of this tree within its sibling list.
         *  Returns -1 if the tree is the root.
         */
        that.getIndex = function () {
            var siblings = this.getSiblings() || [];
            var index = -1;

            for (var i = 0; i < siblings.length; i++) {
                if (siblings[i] === this) {
                    index = i;
                    break;
                }
            }

            return index;
        };

        /*
         *  Returns the depth of this node in its tree. The depth of a node
         *  is defined as the length of the node's path to its root.
         *  The depth of a root node is zero.
         */
        that.getDepth = function () {
            var gameTree = this;
            var depth = 0;

            while (!gameTree.isRoot()) {
                gameTree = gameTree.getParent();
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
        that.getHeight = function () {
            var children = this.getChildren() || [];
            var max = 0;

            for (var i = 0; i < children.length; i++) {
                var height = children[i].getHeight()+1;
                max = height > max ? height : max;
            }

            return max;
        };

        that.getLeafCount = function () {
            var children = this.getChildren() || [];
            var sum = 0;

            for (var i = 0; i < children.length; i++) {
                sum += !children[i].isLeaf() ? children[i].getLeafCount() : 1;
            }

            return sum;
        };

        return that;
    };

    SGFGrove.collection.gameTree.mutable = function (that) {
        that = that || {};

        var isInteger = SGFGrove.Util.isInteger;

        that.addChild = function (child) {
            return this.insertChild(this.getChildCount(), child);
        };

        that.insertChild = function (index, child) {
            index = isInteger(index) ? index : index.getIndex();

            if (index < 0 || index > this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            if (!child.isRoot()) {
                throw new Error("Not a root node");
            }

            this.children.splice(index, 0, child);
            child.parent = this;

            return;
        };

        that.removeChild = function (index) {
            index = isInteger(index) ? index : index.getIndex();

            if (index < 0 || index >= this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            var child = this.children.splice(index, 1)[0];
                child.parent = null;

            return child;
        };

        return that;
    };

    SGFGrove.collection.gameTree.iterable = function (that) {
        that = that || {};

        /*
        that.getNext = function () {
            var next;

            if (!this.isLeaf()) {
                next = this.getChild(0);
            }
            else {
                var sibling = this;
                while (!next && sibling) {
                    next = sibling.getNextSibling();
                    sibling = sibling.getParent();
                }
            }

            return next;
        };

        that.getPrevious = function () {
            var previous = this.getPreviousSibling();

            if (!previous) {
                previous = this.getParent();
            }
            else {
                while (!previous.isLeaf()) {
                    previous = previous.getChild(previous.getChildCount()-1);
                }
            }

            return previous;
        };

        that.getNextSibling = function () {
            var siblings = this.getSiblings() || [];
            var next = null;

            for (var i = 0; i < siblings.length; i++) {
                if (siblings[i] === this && i+1 < siblings.length) {
                    next = siblings[i+1];
                    break;
                }
            }

            return next;
        };

        that.getPreviousSibling = function () {
            var siblings = this.getSiblings() || [];
            var previous = null;

            for (var i = siblings.length-1; i >= 0; i--) {
                if (siblings[i] === this && i-1 >= 0) {
                    previous = siblings[i-1];
                    break;
                }
            }

            return previous;
        };
        */

        return that;
    };

    SGFGrove.collection.gameTree.visitor = function (that) {
        that = that || {};

        that.getMainLine = function () {
            var gameTree = this.getRoot();
            var mainLine = [gameTree];

            while (!gameTree.isLeaf()) {
                gameTree = gameTree.getChild(0);
                mainLine.push(gameTree);
            }

            return mainLine;
        };

        that.getPath = function () {
            var gameTree = this;
            var path = [gameTree];

            while (!gameTree.isRoot()) {
                gameTree = gameTree.getParent();
                path.push(gameTree);
            }

            path.reverse();

            return path;
        };

        return that;
    };

    /*
    SGFGrove.collection.gameTree = function () {
        var that = {};

        var isArray   = SGFGrove.Util.isArray,
            isInteger = SGFGrove.Util.isInteger;

        that.create = function () {
            var that = SGFGrove.Util.create(this);
            that.init.apply(that, arguments);
            return that;
        };

        that.init = function (tree, parent) {
            tree = tree || this.createTree();
            parent = parent || null;

            this.tree = tree;

            this.current = this;
            this.parent = parent;
            this.history = [];

            this.sequence = tree[0];
            this.baseDepth = parent ? parent.baseDepth+parent.depth : 0;
            this.depth = 0;

            this.children = tree[1];
            this.index = 0;

            return;
        };

        that.createTree = function () {
            return [
                [{
                    FF: 4,
                    GM: 1,
                    CA: "UTF-8",
                    AP: ["SGFGrove", SGFGrove.VERSION]
                }],
                []
            ];
        };

        that.toSGF = function () {
            return this.tree;
        };

        that.toJSON = function () {
            return this.tree;
        };

        that.clone = function () {
            var tree = (function clone (value) {
                var i, key, val;

                if (!value || typeof value !== "object") {
                    val = value;
                }
                else if (typeof value.clone === "function") {
                    val = value.clone();
                }
                else if (isArray(value)) {
                    val = [];
                    for (i = 0; i < value.length; i++) {
                        val[i] = clone(value[i]);
                    }
                }
                else {
                    val = {};
                    for (key in value) {
                        if (value.hasOwnProperty(key)) {
                            val[key] = clone(value[key]);
                        }
                    }
                }

                return val;
            }(this.tree));

            return this.create(tree);
        };

        that.getHeight = function () {
            var current = this.current;
            var max = current.sequence.length - this.getRelativeDepth() - 1;

            (function findLeaf (children, height) {
                for (var i = 0; i < children.length; i++) {
                    var h = height + children[i][0].length;
                    if (!children[i][1].length) {
                        max = h > max ? h : max;
                    }
                    else {
                        findLeaf(children[i][1], h);
                    }
                }
            }(current.children, max));

            return max;
        };

        that.getLeafCount = function () {
            var found = 0;

            (function findLeaf (children) {
                for (var i = 0; i < children.length; i++) {
                    if (!children[i][1].length) {
                        found += 1;
                    }
                    else {
                        findLeaf(children[i][1]);
                    }
                }
            }([this.current.tree]));

            return found;
        };

        that.getRoot = function () {
            return this.sequence[0];
        };

        that.getRelativeDepth = function () {
            return this.current.depth !== 0 ? this.current.depth-1 : 0;
        };

        that.getDepth = function () {
            return this.current.baseDepth + this.getRelativeDepth();
        };

        that.getNode = function () {
            return this.current.sequence[this.getRelativeDepth()];
        };

        that.setNode = function (node) {
            this.current.sequence[this.getRelativeDepth()] = node;
            return;
        };

        that.rewind = function () {
            this.current = this;
            this.history.length = 0;
            this.depth = 0;
            this.index = 0;
            return this;
        };

        that.next = function () {
            var current = this.current;

            if (current.depth >= current.sequence.length) {
                while (current) {
                    if (current.index < current.children.length) {
                        current = this.create(current.children[current.index++], current);
                        this.history.push(this.current);
                        this.current = current;
                        break;
                    }
                    current = current.parent;
                }
            }

            return current && current.sequence[current.depth++];
        };

        that.hasNext = function () {
            var current = this.current;

            if (current.depth < current.sequence.length) {
                return true;
            }

            while (current) {
                if (current.index < current.children.length) {
                    return true;
                }
                current = current.parent;
            }

            return false;
        };

        that.peek = function () {
            var current = this.current;

            if (current.depth < current.sequence.length) {
                return current.sequence[current.depth];
            }

            while (current) {
                if (current.index < current.children.length) {
                    return current.children[current.index][0][0];
                }
                current = current.parent;
            }

            return null;
        };

        that.previous = function () {
            var current = this.current;

            if (current.depth > 1) {
                current.depth -= 1;
            }
            else if (this.history.length) {
                current.parent.index -= 1;
                current = this.history.pop();
                this.current = current;
            }
            else {
                return null;
            }

            return current.sequence[current.depth-1];
        };

        that.hasPrevious = function () {
            return this.current.depth > 1 || !!this.history.length;
        };

        that.lookBack = function () {
            var current = this.current;

            if (current.depth > 1) {
                return current.sequence[current.depth-2];
            }

            if (this.history.length) {
                current = this.history[this.history.length-1];
                return current.sequence[current.depth-1];
            }

            return null;
        };

        that.getIndex = function () {
            var current = this.current;

            if (current.depth > 1) {
                return 0;
            }
            else if (current.parent) {
                return current.parent.index - 1;
            }

            return null;
        };

        that.getChildIndexOf = function (node) {
            var children = this.getChildren();

            for (var i = 0; i < children.length; i++) {
                if (children[i] === node) {
                    return i;
                }
            }

            return -1;
        };

        that.appendChild = function (tree) {
            return this.insertChildAt(this.getChildCount(), tree);
        };

        that.insertChildAt = function (index, tree) {
            var current = this.current;
            var sequence = current.sequence;
            var children = current.children;
            var depth = this.getRelativeDepth() + 1; 

            if (!isInteger(index)) {
                index = this.getChildIndexOf(index);
            }

            if (index < 0 || index > this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            if (tree && typeof tree === "object" && isArray(tree.tree)) {
                tree = tree.tree;
            }
            else if (!isArray(tree)) {
                tree = [[tree], []];
            }

            if (depth < sequence.length) {
                children.push([
                    sequence.splice(depth),
                    children.splice(0)
                ]);
            }
            else if (!children.length) {
                sequence.push.apply(sequence, tree[0]);
                children.push.apply(children, tree[1]);
                return;
            }

            children.splice(index, 0, tree);

            return;
        };

        that.removeChildAt = function (index) {
            var current = this.current;
            var sequence = current.sequence;
            var children = current.children;
            var depth = this.getRelativeDepth() + 1;
            var tree, child;

            if (!isInteger(index)) {
                index = this.getChildIndexOf(index);
            }

            if (index < 0 || index >= this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            if (depth < sequence.length) {
                tree = [sequence.splice(depth), children.splice(0)];
            }
            else {
                tree = children.splice(index, 1)[0];
            }

            if (children.length === 1) {
                child = children.shift();
                sequence.push.apply(sequence, child[0]);
                children.push.apply(children, child[1]);
            }
 
            return this.create(tree);
        };

        that.replaceChildAt = function (index, tree) {
            index = isInteger(index) ? index : this.getChildIndexOf(index);
            var gameTree = this.removeChildAt(index);
            this.insertChildAt(index, tree);
            return gameTree;
        };

        that.isLeaf = function () {
            return this.current.children.length === 0 &&
                   this.getRelativeDepth()+1 >= this.current.sequence.length;
        };

        that.isRoot = function () {
            return !this.current.parent && this.current.depth <= 1;
        };

        that.getChildren = function () {
            var current = this.current;
            var children = current.children;
            var depth = this.getRelativeDepth() + 1;
            var nodes = [];

            if (depth < current.sequence.length) {
                nodes[0] = current.sequence[depth];
            }
            else {
                for (var i = 0; i < children.length; i++) {
                    nodes[i] = children[i][0][0];
                }
            }

            return nodes;
        };

        that.getChildCount = function () {
            var current = this.current;

            if (this.getRelativeDepth()+1 < current.sequence.length) {
                return 1;
            }

            return current.children.length;
        };

        that.getSiblings = function () {
            var current = this.current;
            var siblings = current.parent && current.parent.children;
            var nodes = [];

            if (current.depth > 1) {
                nodes[0] = current.sequence[current.depth-1];
            }
            else if (siblings) {
                for (var i = 0; i < siblings.length; i++) {
                    nodes[i] = siblings[i][0][0];
                }
            }
            else {
                return null;
            }

            return nodes;
        };

        that.getParent = function () {
            var current = this.current;

            if (current.depth > 1) {
                return current.sequence[current.depth-2];
            }

            if (current.parent) {
                current = current.parent;
                return current.sequence[current.depth-1];
            }

            return null;
        };

        that.getAncestors = function () {
            var current = this.current;
            var nodes = current.sequence.slice(0, this.getRelativeDepth()+1);

            while (current = current.parent) { // jshint ignore:line
                nodes.unshift.apply(nodes, current.sequence);
            }

            return nodes;
        };

        that.init.apply(that, arguments);

        return that;
    };
    */

}());

