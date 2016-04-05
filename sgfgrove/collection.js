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

        /*
        that.parse = function (text, reviver) {
            var trees = SGFGrove.parse(text || "", reviver);
            var other = this.create();
            var gameTree = this.createGameTree();

            for (var i = 0; i < trees.length; i++) {
                other[i] = gameTree.parse(trees[i]);
            }

            return other;
        };
        */

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

    var collection = function () {
        var that = {};

        that.create = function () {
            var other = SGFGrove.Util.create(this);
            other.initialize.apply(that, arguments);
            return other;
        };

        that.initialize = function () {
            this.length = 0;
            this.push.apply(this, arguments);
        };

        that.createGameTree = function (tree) {
            return collection.gameTree(tree);
        };

        that.parse = function (trees) {
            trees = trees || [];

            var other = this.create();
            for (var i = 0; i < trees.length; i++) {
                other.push(this.createGameTree(trees[i]));
            }

            return other;
        };

        that.parseString = function (text, reviver) {
            return this.parse(SGFGrove.parse(text || "", reviver));
        };

        that.push    = Array.prototype.push;
        that.toArray = Array.prototype.slice;

        that.toString = function (replacer, space) {
            return SGFGrove.stringify(this, replacer, space);
        };

        that.toSGF = function () {
            return this.toArray();
        };

        that.toJSON = that.toSGF;

        that.clone = function () {
            var other = this.create();

            for (var i = 0; i < this.length; i++) {
                other.push(this[i].clone());
            }

            return other;
        };

        that.initialize.apply(that, arguments);

        return that;
    };

    collection.gameTree = function (tree) {
        var that = collection.gameTree.node();

        that.parse = function (tree, parent) {
            tree = tree || [[{}], []];

            var other = this.create(this.parseProperties(tree[0][0]), parent);

            var node = other;
            for (var i = 1; i < tree[0].length; i++) {
                node = this.create(this.parseProperties(tree[0][i]), node);
            }

            for (var j = 0; j < tree[1].length; j++) {
                this.parse(tree[1][j], node);
            }

            return other;
        };

        that.parseProperties = function (properties) {
            return properties;
        };

        //that.parse.apply(that, arguments);

        return that.parse(tree);
    };

    collection.gameTree.node = function () {
        var that = {};

        collection.util.accessor(that, "parent");
        collection.util.accessor(that, "children");
        collection.util.accessor(that, "properties");

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
            if (properties !== undefined) {
                this.properties(properties);
            }
            if (parent) {
                parent.append(this);
            }
        };

        that.buildParent = function () {
            return null;
        };

        that.buildChildren = function () {
            return [];
        };

        that.root = function () {
            var root = this;

            while (!root.isRoot()) {
                root = root.parent();
            }

            return root;
        };

        that.siblings = function () {
            return !this.isRoot() ? this.parent().children() : null;
        };

        that.isRoot = function () {
            return this.parent() === null;
        };

        that.isLeaf = function () {
            return this.children().length === 0;
        };

        that.depth = function () {
            var depth = 0;

            var node = this;
            while (!node.isRoot()) {
                node = node.parent();
                depth += 1;
            }

            return depth;
        };

        that.height = function () {
            var heights = [0];

            var children = this.children();
            for (var i = 0; i < children.length; i++) {
                heights[i+1] = children[i].height()+1;
            }

            return Math.max.apply(null, heights);
        };

        that.indexOf = function (child) {
            var children = this.children();
            for (var i = 0; i < children.length; i++) {
                if (children[i] === child) {
                    return i;
                }
            }
            return -1;
        };

        that.contains = function (other) {
            for (var node = other; node; node = node.parent()) {
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
            return [[this.properties()], this.children()];
        };

        that.toString = function (replacer, space) {
            if (this.isRoot()) {
                return SGFGrove.stringify([this], replacer, space);
            }
            throw new Error("Not a root node");
        };

        that.toJSON = function () {
            var sequence = [this.properties()];

            var node = this;
            while (node.children().length === 1) {
                node = node.children()[0];
                sequence.push(node.properties());
            }

            return [sequence, node.children()];
        };

        return that;
    };

    collection.gameTree.node.mutable = function (that) {
        that = that || {};

        that.prepend = function (node) {
            this.insertAt(0, node);
        };

        that.append = function (node) {
            this.insertAt(this.children().length, node);
        };

        that.insertAt = function (index, node) {
            var children = this.children();

            if (node.contains(this)) {
                throw new Error("Ancestor node given");
            }

            node.detach();
            node.parent(this);

            if (!SGFGrove.Util.isInteger(index)) {
                throw new Error("Not an integer");
            }
            else if (index < 0 || index > children.length) {
                throw new Error("Index out of bounds: "+index);
            }

            children.splice(index, 0, node);

            return;
        };

        that.removeAt = function (index) {
            var children = this.children();

            if (!SGFGrove.Util.isInteger(index)) {
                throw new Error("Not an integer");
            }
            else if (index < 0 || index >= children.length) {
                throw new Error("Index out of bounds: "+index);
            }

            var node = children.splice(index, 1)[0];
                node.parent(null);

            return node;
        };

        that.detach = function () {
            var parent = this.parent();

            if (parent) {
                parent.removeAt(parent.indexOf(this));
            }

            return parent;
        };

        that.empty = function () {
            var children = this.children().slice(0);

            for (var i = 0; i < children.length; i++) {
                children[i].detach();
            }

            return children;
        };

        that.before = function (node) {
            var parent = this.parent();

            if (!parent) {
                throw new Error("Has no siblings");
            }

            parent.insertAt(parent.indexOf(this), node);

            return this;
        };

        that.after = function (node) {
            this.replaceWith(node);
            node.before(this);
            return this;
        };

        that.replaceWith = function (node) {
            var parent = this.parent();
            var index = parent && parent.indexOf(this);

            if (!parent) {
                throw new Error("Has no parent");
            }

            this.detach();
            parent.insertAt(index, node);

            return this;
        };

        return that;
    };

    collection.gameTree.node.cloneable = function (that) {
        that = that || {};

        that.clone = function () {
            var other = this.create(this.cloneProperties());

            var children = this.children();
            for (var i = 0; i < children.length; i++) {
                other.append(children[i].clone());
            }

            return other;
        };

        that.cloneProperties = function (value) {
            value = !arguments.length ? this.properties() : value;

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

        collection.util.iterable(that);

        collection.util.accessor(that, "preorder");
        collection.util.accessor(that, "postorder");
        collection.util.accessor(that, "breadthFirst");

        that.buildPreorder = function () {
            return collection.gameTree.node.iterable.preorder(this);
        };

        that.buildPostorder = function () {
            return collection.gameTree.node.iterable.postorder(this);
        };

        that.buildBreadthFirst = function () {
            return collection.gameTree.node.iterable.breadthFirst(this);
        };

        that.toIterator = function () {
            return this.preorder().toIterator();
        };

        that.next = function () {
            if (!this.isLeaf()) {
                return this.children()[0];
            }

            for (var node = this; node; node = node.parent()) {
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
                return this.parent();
            }

            while (!node.isLeaf()) {
                var children = node.children();
                node = children[children.length-1];
            }

            return node;
        };

        that.nextSibling = function () {
            var parent = this.parent();
            var index = parent && parent.indexOf(this);
            return parent && parent.children()[index+1];
        };

        that.previousSibling = function () {
            var parent = this.parent();
            var index = parent && parent.indexOf(this);
            return parent && parent.children()[index-1];
        };

        return that;
    };

    collection.gameTree.node.iterable.preorder = function (node) {
        var that = collection.util.iterable([node]);

        that.toIterator = function () {
            var other = [this[0]];

            other.next = function () {
                if (this.length) {
                    var node = this.pop();
                    var children = node.children().slice(0);
                    this.push.apply(this, children.reverse());
                    return { value: node };
                }
                return { done: true };
            };

            return other;
        };

        return that;
    };

    collection.gameTree.node.iterable.postorder = function (node) {
        var that = collection.util.iterable([node]);

        that.toIterator = function () {
            var other = [[this[0], false]];

            other.next = function () {
                if (this.length) {
                    while (true) {
                        var node = this[this.length-1];
                        if (node[1]) {
                            return { value: this.pop()[0] };
                        }
                        var children = node[0].children();
                        for (var i = children.length-1; i >= 0; i--) {
                            this.push([children[i], false]);
                        }
                        node[1] = true;
                    }
                }
                return { done: true };
            };

            return other;
        };

        return that;
    };

    collection.gameTree.node.iterable.breadthFirst = function (node) {
        var that = collection.util.iterable([node]);

        that.toIterator = function () {
            var other = [this[0]];

            other.next = function () {
                if (this.length) {
                    var node = this.shift();
                    this.push.apply(this, node.children());
                    return { value: node };
                }
                return { done: true };
            };

            return other;
        };

        return that;
    };
 
    collection.util = {};

    collection.util.accessor = function (that, key) {
        that = that || {};

        var builder = "build"+key.charAt(0).toUpperCase()+key.slice(1),
            _key    = "_"+key;

        that[key] = function (value) {
            if (arguments.length) {
                this[_key] = value;
                return this;
            }
            if (!this.hasOwnProperty(_key) &&
                typeof this[builder] === "function") {
                this[_key] = this[builder]();
            }
            return this[_key];
        };

        return that;
    };

    collection.util.iterable = function (that) {
        that = that || {};

        that.toIterator = function () {
            throw new Error("call to abstract method 'toIterator'");
        };

        if (typeof Symbol === "function" &&
            typeof Symbol.iterator === "symbol") {
            that[Symbol.iterator] = function () {
                return this.toIterator();
            };
        }

        that.forEach = function (callback, context) {
            var iterator = this.toIterator();

            while (true) {
                var next = iterator.next();
                if (next.done) {
                    break;
                }
                callback.call(context, next.value);
            }

            return this;
        };

        that.find = function (callback, context) {
            var iterator = this.toIterator();

            while (true) {
                var next = iterator.next();
                if (next.done) {
                    break;
                }
                if (callback.call(context, next.value)) {
                    return next.value;
                }
            }

            return;
        };

        that.filter = function (callback, context) {
            var iterator = this.toIterator();
            var values = [];

            while (true) {
                var next = iterator.next();
                if (next.done) {
                    break;
                }
                if (callback.call(context, next.value)) {
                    values.push(next.value);
                }
            }

            return values;
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

