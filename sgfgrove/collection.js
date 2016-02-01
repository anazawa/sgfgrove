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

        that.firstChild = function () {
            return this.getChild(0);
        };

        that.lastChild = function () {
            return this.getChild(Math.max(0, this.getChildCount()-1));
        };

        that.isRoot = function () {
            return this.getParent() === null;
        };

        that.isLeaf = function () {
            return this.getChildCount() === 0;
        };

        that.root = function () {
            var root = this;

            while (!root.isRoot()) {
                root = root.getParent();
            }

            return root;
        };

        that.siblings = function () {
            return !this.isRoot() ? this.getParent().getChildren() : null;
        };

        that.depth = function () {
            var depth = 0;

            var node = this;
            while (!node.isRoot()) {
                node = node.getParent();
                depth += 1;
            }

            return depth;
        };

       that.height = function () {
            var heights = [0];

            var children = this.getChildren();
            for (var i = 0; i < children.length; i++) {
                heights[i+1] = children[i].height()+1;
            }

            return Math.max.apply(null, heights);
        };

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

        that.appendChild = function (child) {
            return this.insertChild(child, this.getChildCount());
        };

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

        that.nextSibling = function () {
            var parent = this.getParent();
            var index = parent && parent.childIndexOf(this);
            return parent ? parent.getChild(index+1) : null;
        };

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

