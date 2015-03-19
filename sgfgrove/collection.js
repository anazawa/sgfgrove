(function () {
  "use strict";

  var SGFGrove;

  if ( typeof exports !== "undefined" ) {
    SGFGrove = require("../sgfgrove.js");
  }
  else {
    SGFGrove = window.SGFGrove;
  }

  var isArray = SGFGrove.Util.isArray;

  SGFGrove.Collection = function () {};

  SGFGrove.Collection.GameTree = (function () {
    var push    = Array.prototype.push;
    var splice  = Array.prototype.splice;
    var concat  = Array.prototype.concat;
    var unshift = Array.prototype.unshift;

    var GameTree = function (tree, parent) {
      this.tree = tree || [[{}], []];
      this.parent = parent;
      this.subtree = this;
      this.sequence = this.tree[0];
      this.depth = 0;
      this.children = this.tree[1];
      this.index = 0;
    };

    GameTree.prototype.buildGameTree = function (tree, parent) {
      return new GameTree( tree, parent );
    };

    GameTree.prototype.clone = function () {
      var clone = this.buildGameTree( this.tree, this.parent );

      clone.depth = this.depth;
      clone.index = this.index;

      if ( this.subtree !== this ) {
        clone.subtree = this.subtree.clone();
      }

      return clone;
    };

    GameTree.prototype.toSGF = function () {
      return this.tree;
    };

    GameTree.prototype.accept = function (visitor) {
      if ( visitor && typeof visitor === "object" &&
           typeof visitor.visit === "function" ) {
        return visitor.visit(this);
      }
    };

    GameTree.prototype.rewind = function () {
      this.subtree = this;
      this.depth = 0;
      this.index = 0;
      return this;
    };

    GameTree.prototype.getNext = function () {
      var subtree = this.subtree;

      if ( subtree.depth < subtree.sequence.length ) {
        subtree.index = 0;
        return subtree.sequence[subtree.depth++];
      }

      while ( subtree ) {
        if ( subtree.index < subtree.children.length ) {
          this.subtree = this.buildGameTree(
            subtree.children[subtree.index++],
            subtree
          );
          return this.getNext();
        }
        subtree = subtree.parent;
      }

      return;
    };

    GameTree.prototype.hasNext = function () {
      var subtree = this.subtree;

      if ( subtree.depth < subtree.sequence.length ) {
        return true;
      }

      while ( subtree ) {
        if ( subtree.index < subtree.children.length ) {
          return true;
        }
        subtree = subtree.parent;
      }

      return false;
    };

    GameTree.prototype.peek = function () {
      var subtree = this.subtree;

      if ( subtree.depth < subtree.sequence.length ) {
        return subtree.sequence[subtree.depth];
      }

      while ( subtree ) {
        if ( subtree.index < subtree.children.length ) {
          return subtree.children[subtree.index][0][0];
        }
        subtree = subtree.parent;
      }

      return;
    };

    GameTree.prototype.getNextChild = function () {
      var subtree = this.subtree;

      if ( subtree.depth < subtree.sequence.length ) {
        if ( subtree.index < 1 ) {
          subtree.index += 1;
          return subtree.sequence[subtree.depth];
        }
        return;
      }

      if ( subtree.index < subtree.children.length ) {
        return subtree.children[subtree.index++][0][0];
      }

      return;
    };

    GameTree.prototype.getChildren = function () {
      var subtree = this.subtree;
      var nodes = [];

      if ( subtree.depth < subtree.sequence.length ) {
        nodes.push( subtree.sequence[subtree.depth] );
      }
      else {
        var children = subtree.children;
        for ( var i = 0; i < children.length; i++ ) {
          nodes.push( children[i][0][0] );
        }
      }

      return nodes;
    };

    GameTree.prototype.getSiblings = function () {
      var subtree = this.subtree;
      var depth = subtree.getCurrentDepth();
      var nodes = [];

      if ( depth > 0 ) {
        nodes.push( subtree.sequence[depth] );
      }
      else if ( subtree.parent ) {
        var children = subtree.parent.children;
        for ( var i = 0; i < children.length; i++ ) {
          nodes.push( children[i][0][0] );
        }
      }

      return nodes;
    };

    GameTree.prototype.getParent = function () {
      var subtree = this.subtree;
      var depth = this.getCurrentDepth();

      if ( depth > 0 ) {
        return subtree.sequence[depth-1];
      }
      else if ( subtree.parent ) {
        var sequence = subtree.parent.sequence;
        return sequence[sequence.length-1];
      }

      return;
    };

    /*
    GameTree.prototype.getPrevious = function () {
      var gameTree = this.gameTree;

      if ( gameTree.depth > 1 ) {
        gameTree.depth -= 1;
        return gameTree.sequence[gameTree.depth-1];
      }

      return;
    };

    GameTree.prototype.getPreviousChild = function () {
      var gameTree = this.gameTree.parent;
      var child;

      if ( !gameTree ) {
        return;
      }

      if ( gameTree.index > 1 ) {
        gameTree.index--;
        while ( gameTree.children.length ) {
          child = gameTree.children[gameTree.index-1];
          gameTree = this.buildGameTree( child, gameTree );
          gameTree.depth = gameTree.sequence.length;
          gameTree.index = gameTree.children.length;
        }
      }

      this.gameTree = gameTree;

      return child || this.getCurrentChild();
    };
    */

    GameTree.prototype.getFirst = function () {
      return this.rewind().getNext();
    };

    GameTree.prototype.getLast = function () {
      while ( this.getNext() ) {}
      return this.getCurrent();
    };

    GameTree.prototype.getCurrentDepth = function () {
      return this.subtree.depth !== 0 ? this.subtree.depth-1 : 0;
    };

    GameTree.prototype.getCurrentIndex = function () {
      return this.subtree.index !== 0 ? this.subtree.index-1 : 0;
    };

    GameTree.prototype.getCurrent = function () {
      return this.subtree.sequence[this.getCurrentDepth()];
    };

    GameTree.prototype.setCurrent = function (node) {
      this.subtree.sequence[this.getCurrentDepth()] = node;
    };

    GameTree.prototype.getCurrentChild = function () {
      var subtree = this.subtree;

      if ( subtree.depth < subtree.sequence.length ) {
        return subtree.sequence[subtree.depth];
      }

      return subtree.children[this.getCurrentIndex()][0][0];
    };

    GameTree.prototype.getAbsoluteDepth = function () {
      var subtree = this.subtree;
      var depth = subtree.getCurrentDepth();

      while ( subtree = subtree.parent ) {
        depth += subtree.sequence.length;
      }

      return depth;
    };

    GameTree.prototype.getAbsoluteIndex = function () {
      var current = this.subtree.tree;
      var found = 0;

      (function findLeaf (children) {
        for ( var i = 0; i < children.length; i++ ) {
          if ( children[i] === current ) {
            return false;
          }
          if ( !children[i][1].length ) {
            found += 1;
          }
          else {
            var ret = findLeaf( children[i][1] );
            if ( ret === false ) { return ret; }
          }
        }
      }(this.children));

      return found;
    };

    GameTree.prototype.getHeight = function () {
      var max = 0;

      (function findLeaf (children, height) {
        for ( var i = 0; i < children.length; i++ ) {
          var h = height + children[i][0].length;
          if ( !children[i][1].length ) {
            max = h > max ? h : max;
          }
          else {
            findLeaf( children[i][1], h );
          }
        }
      }(this.children, this.sequence.length));

      return max;
    };

    GameTree.prototype.getWidth = function () {
      var found = 0;

      (function findLeaf (children) {
        for ( var i = 0; i < children.length; i++ ) {
          if ( !children[i][1].length ) {
            found += 1;
          }
          else {
            findLeaf( children[i][1] );
          }
        }
      }(this.children));

      return found;
    };

    GameTree.prototype.isLeaf = function () {
      return this.subtree.children.length === 0 &&
             this.subtree.depth === this.subtree.sequence.length;
    };

    GameTree.prototype.isRoot = function () {
      return !this.parent && this.getCurrentDepth() === 0;
    };

    GameTree.prototype.remove = function () {
      var subtree = this.subtree;
      var parent = subtree.parent;
      var node;

      if ( !parent && subtree.sequence.length === 1 ) {
        throw new Error("GameTree must contain at least one node");
      }

      node = subtree.sequence.splice(this.getCurrentDepth(), 1)[0];

      if ( subtree.depth > subtree.sequence.length ) {
        subtree.depth = subtree.sequence.length;
      }

      if ( subtree.sequence.length ) {
        return node;
      }

      // merge gameTree.children into parent.children
      splice.apply(
        parent.children,
        [parent.getCurrentIndex(), 1].concat(subtree.children)
      );

      if ( parent.index > parent.children.length ) {
        parent.index = parent.children.length;
      }

      if ( parent.children.length ) {
        this.subtree = this.buildGameTree(
          parent.children[parent.getCurrentIndex()],
          parent
        );
      }
      else {
        this.subtree = parent;
      }

      return node;
    };

    GameTree.prototype.insert = function (node) {
      this.subtree.sequence.splice(this.getCurrentDepth(), 0, node);
    };

    GameTree.prototype.push = function (nodes) {
      var args = isArray(nodes) ? nodes : arguments;
      var subtree = this.subtree;
      var sequence = subtree.sequence;

      if ( subtree.children.length ) {
        var child = subtree.children[this.getCurrentIndex()];
        while ( child ) {
          sequence = child[0];
          child = child[1][0];
        }
      }

      push.apply( sequence, args );

      return;
    };

    GameTree.prototype.pop = function (node) {
      var that = this;

      if ( !that.isLeaf() ) {
        that = that.clone();
        while ( !that.isLeaf() ) {
          that.getNext();
        }
      }

      return that.remove();
    };

    GameTree.prototype.shift = function (node) {
      var that = this.isRoot() ? this : this.buildGameTree(this.tree);
      return that.remove();
    };

    GameTree.prototype.unshift = function () {
      var root = this;

      while ( root.parent ) {
        root = root.parent;
      }

      unshift.apply( root.sequence, arguments );

      return;
    };

    GameTree.prototype.slice = function (start, end) {
      var subtree = this.subtree;
      var sequences = [];

      if ( subtree.children.length ) {
        var child = subtree.children[this.getCurrentIndex()];
        while ( child ) {
          sequences.push( child[0] );
          child = child[1][0];
        }
      }

      while ( subtree ) {
        sequences.unshift( subtree.sequence );
        subtree = subtree.parent;
      }

      return arguments.length
               ? concat.apply([], sequences).slice(start, end)
               : concat.apply([], sequences);
    };

    GameTree.prototype.getLength = function () {
      var subtree = this.subtree;
      var length = 0;

      if ( subtree.children.length ) {
        var child = subtree.children[this.getCurrentIndex()];
        while ( child ) {
          length += child[0].length;
          child = child[1][0];
        }
      }

      while ( subtree ) {
        length += subtree.sequence.length;
        subtree = subtree.parent;
      }

      return length;
    };

    return GameTree;
  }());

}());

