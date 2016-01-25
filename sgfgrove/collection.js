(function () {
    "use strict";

    var SGFGrove;

    var collection = function () {
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

            that.initialize.apply(that, arguments);

            return that;
        };

        that.initialize = function () {
            var trees;

            if (typeof arguments[0] === "string") {
                trees = this.parse(arguments[0], arguments[1]);
            }
            else if (SGFGrove.Util.isArray(arguments[0])) {
                trees = arguments[0];
            }

            if (trees) {
                for (var i = 0; i < trees.length; i++) {
                    this[i] = this.createGameTree(trees[i]);
                }
            }
            else {
                this.push.apply(this, arguments);
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

        that.slice = function () {
            return this.create.apply(this, slice.apply(this, arguments));
        };

        that.splice = function () {
            return this.create.apply(this, splice.apply(this, arguments));
        };

        that.concat = function () {
            return this.create.apply(this, concat.apply(this, arguments));
        };

        if (typeof filter === "function") {
            that.filter = function () {
                return this.create.apply(this, filter.apply(this, arguments));
            };
        }

        that.initialize.apply(that, arguments);

        return that;
    };

    collection.gameTree = function (tree) {
        return collection.gameTree.node(tree);
    };

    collection.gameTree.node = function () {
        var that = {};

        that.create = function () {
            var that = SGFGrove.Util.create(this);
            that.initialize.apply(that, arguments);
            return that;
        };

        that.initialize = function (tree, parent) {
            tree = SGFGrove.Util.isArray(tree) ? tree : [[tree || {}], []];

            this.parent     = null;
            this.children   = [];
            this.properties = {};

            var properties = tree[0][0];
            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    this.set(key, properties[key]);
                }
            } 

            if (parent) {
                parent.appendChild(this);
            }

            var node = this,
                root = this.root();

            for (var i = 1; i < tree[0].length; i++) {
                var child = root.create(tree[0][i], node);
                node.appendChild(child);
                node = child;
            }

            for (var j = 0; j < tree[1].length; j++) {
                node.appendChild(root.create(tree[1][j], node));
            }

            return;
        };

        that.getProperties = function () {
            return this.properties;
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
            if (!this.isRoot()) {
                var siblings = this.getParent().getChildren();
                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i] === this) {
                        return i;
                    }
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

        collection.gameTree.node.properties(that);
        collection.gameTree.node.serializable(that);
        collection.gameTree.node.mutable(that);
        collection.gameTree.node.cloneable(that);
        collection.gameTree.node.iterable(that);
        collection.gameTree.node.path(that);

        that.initialize.apply(that, arguments);

        return that;
    };

    collection.gameTree.node.properties = function (that) {
        that = that || {};

        var aliases = {
            // Move properties
            B  : "blackMove",
            KO : "ko",
            MN : "moveNumber",
            W  : "whiteMove",
            // Setup properties
            AB : "",
            AE : "",
            AW : "",
            PL : "",
            // Node annotation properties
            C  : "comment",
            DM : "",
            GB : "goodForBlack",
            GW : "goodForWhite",
            HO : "",
            N  : "",
            UC : "",
            V  : "",
            // Move annotation properties
            BM : "badMove",
            DO : "doubtfulMove",
            IT : "interestingMove",
            TE : "tesuji",
            // Markup properties
            AR : "",
            CR : "",
            DD : "",
            LB : "",
            LN : "",
            MA : "",
            SL : "",
            SQ : "",
            TR : "",
            // Root properties 
            AP : "application",
            CA : "charset",
            FF : "fileFormat",
            GM : "",
            ST : "",
            SZ : "boardSize",
            // Game info properties
            AN : "annotator",
            BR : "",
            BT : "",
            CP : "copyright",
            DT : "date",
            EV : "event",
            GN : "gameName",
            GC : "gameComment",
            ON : "",
            OT : "",
            PB : "",
            PC : "place",
            PW : "",
            RE : "result",
            RO : "round",
            RU : "",
            SO : "source",
            TM : "",
            US : "user",
            WR : "",
            WT : "",
            // Timing properties
            BL : "",
            OB : "",
            OW : "",
            WL : "",
            // Miscellaneous properties
            FG : "",
            PM : "",
            VW : "",
            // Go-specific properties
            KM : "komi",
            HA : "handicap",
            TB : "blackTerritory",
            TW : "whiteTerritory",
            // Obsolete properties
            BS : "",
            CH : "",
            EL : "",
            EX : "",
            ID : "",
            L  : "",
            LT : "",
            M  : "",
            OM : "",
            OP : "",
            OV : "",
            RG : "",
            SC : "",
            SE : "", // XXX
            SI : "",
            TC : "",
            WS : ""
        };

        var makeAccessor = function (key) {
            return function (value) {
                if (arguments.length) {
                    return this.set(key, value);
                }
                return this.get(key);
            };
        };

        for (var key in aliases) {
            if (aliases.hasOwnProperty(key)) {
                that[aliases[key]] = makeAccessor(key);
            }
        }

        that.get = function (key) {
            return this.properties[key];
        };

        that.set = function (key, value) {
            this.properties[key] = value;
            return this;
        };

        that.has = function (key) {
            return this.properties.hasOwnProperty(key);
        };

        that.remove = function (key) {
            var value = this.properties[key];
            delete this.properties[key];
            return value;
        };

        that.clear = function () {
            this.properties = {};
            return this;
        };

        that.forEach = function (callback, context) {
            var properties = this.properties;

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    callback.call(context, key, properties[key]);
                }
            }

            return this;
        };

        return that;
    };

    collection.gameTree.node.serializable = function (that) {
        that = that || {};

        that.createCollection = function () {
            return collection.apply(null, arguments);
        };

        that.toSGF = function () {
            var sequence = [this.getProperties()];

            var node = this;
            while (node.getChildCount() === 1) {
                node = node.firstChild();
                sequence.push(node.getProperties());
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

    collection.gameTree.node.mutable = function (that) {
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
         *  Removes the given node from its parent (if it has a parent) and
         *  makes it a child of this node by adding it to the end of this
         *  nodes's array.
         */
        that.appendChild = function (child) {
            return this.insertChild(this.getChildCount(), child);
        };

        /*
         *  Adds the child to this node's child array at the specified index
         *  and sets the child's parent to this node.
         *  The given child must not be an ancestor of this node.
         */
        that.insertChild = function (index, child) {
            index = isInteger(index) ? index : index.index();

            if (index < 0 || index > this.getChildCount()) {
                throw new Error("Index out of bounds: "+index);
            }

            if (child.contains(this)) {
                throw new Error("Ancestor node given");
            }

            if (!child.isRoot()) {
                child.getParent().removeChild(child);
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
        that.replaceChild = function (index, other) {
            index = isInteger(index) ? index : index.index();
            var child = this.removeChild(index);
            this.insertChild(index, other);
            return child;
        };

        return that;
    };

    collection.gameTree.node.cloneable = function (that) {
        that = that || {};

        that.clone = function () {
            var clone = this.create(this.cloneProperties());

            var children = this.getChildren();
            for (var i = 0; i < children.length; i++) {
                clone.appendChild(children[i].clone());
            }

            return clone;
        };

        that.cloneProperties = function () {
            var value = !arguments.length ? this.properties : arguments[0];

            var clone;
            if (!value || typeof value !== "object") {
                clone = value;
            }
            else if (typeof value.clone === "function") {
                clone = value.clone();
            }
            else if (SGFGrove.Util.isArray(value)) {
                clone = [];
                for (var i = 0; i < value.length; i++) {
                    clone[i] = this.cloneProperties(value[i]);
                }
            }
            else {
                clone = {};
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        clone[key] = this.cloneProperties(value[key]);
                    }
                }
            }

            return clone;
        };

        return that;
    };

    collection.gameTree.node.iterable = function (that) {
        that = that || {};

        that.forEachNode = function (callback, context) {
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
         *  Returns the node that precedes this node in a preorder traversal
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

        return that;
    };

    collection.gameTree.node.visitor = function (that) {
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

        /*
        that.mainLine = function () {
            var node = this.root();
            var mainLine = [node];

            while (!node.isLeaf()) {
                node = node.firstChild();
                mainLine.push(node);
            }

            return mainLine;
        };
        */

        return that;
    };

    collection.gameTree.node.path = function (that) {
        that = that || {};

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

    if (typeof exports !== "undefined") {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
        module.exports = collection;
    }
    else {
        SGFGrove = window.SGFGrove;
        SGFGrove.collection = collection;
    }

}());

