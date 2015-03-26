(function () {
  "use strict";

  var SGFGrove;

  if ( typeof exports !== "undefined" ) {
    SGFGrove = require("../sgfgrove.js");
  }
  else {
    SGFGrove = window.SGFGrove;
  }

  SGFGrove.collection = (function () {
    var collection = [];

    var concat = collection.concat;
    var slice  = collection.slice;
    var splice = collection.splice;

    collection.create = function () {
      var that = [];

      that.create         = this.create;
      that.initialize     = this.initialize;
      that.parse          = this.parse;
      that.createTrees    = this.createTrees;
      that.createGameTree = this.createGameTree;
      that.toString       = this.toString;

      that.concat = this.concat;
      that.slice  = this.slice;
      that.splice = this.splice;

      that.initialize.apply( that, arguments );

      return that;
    };

    collection.initialize = function (trees) {
      trees = typeof trees === "string" ? this.parse(trees) : trees;
      trees = trees || this.createTrees();

      for ( var i = 0; i < trees.length; i++ ) {
        this.push( this.createGameTree(trees[i]) );
      }

      return;
    };

    collection.parse = function (text) {
      return SGFGrove.parse(text);
    };

    collection.createTrees = function () {
      return [[
        [{
          FF: 4,
          GM: 1,
          CA: "UTF-8",
          AP: ["SGFGrove", SGFGrove.VERSION]
        }],
        []
      ]];
    };

    collection.createGameTree = function (tree) {
      return SGFGrove.collection.gameTree(tree);
    };

    collection.toString = function (replacer, space) {
      return SGFGrove.stringify(this, replacer, space);
    };

    collection.slice = function () {
      var gameTrees = slice.apply( this, arguments );
      var that = this.create( [] );

      for ( var i = 0; i < gameTrees.length; i++ ) {
        that.push( gameTrees[i] );
      }

      return that;
    };

    collection.splice = function () {
      var gameTrees = splice.apply( this, arguments );
      var that = this.create( [] );

      for ( var i = 0; i < gameTrees.length; i++ ) {
        that.push( gameTrees[i] );
      }

      return that;
    };

    collection.concat = function () {
      var gameTrees = concat.apply( this, arguments );
      var that = this.create( [] );

      for ( var i = 0; i < gameTrees.length; i++ ) {
        that.push( gameTrees[i] );
      }

      return that;
    };

    return function (trees) {
      return collection.create(trees);
    };
  }());

  SGFGrove.collection.gameTree = (function () {
    var isArray = SGFGrove.Util.isArray;
    var splice  = Array.prototype.splice;
    var push    = Array.prototype.push;
    var unshift = Array.prototype.unshift;

    var gameTree = {};

    gameTree.create = function () {
      var that = Object.create( this );
      that.initialize.apply( that, arguments );
      return that;
    };

    gameTree.initialize = function (tree, parent, rest) {
      var lastVisited = rest && rest.lastVisited;
      var baseIndex = 0;

      if ( parent && lastVisited && parent !== lastVisited ) {
        baseIndex = lastVisited.baseIndex + 1;
      }
      else if ( parent ) {
        baseIndex = parent.baseIndex;
      }

      this.tree = tree || this.createTree();
      this.parent = parent;

      this.current = this;
      this.lastVisited = lastVisited || parent;

      this.sequence = this.tree[0];
      this.baseDepth = parent ? parent.baseDepth+parent.sequence.length : 0;
      this.depth = 0;

      this.children = this.tree[1];
      this.baseIndex = baseIndex;
      this.index = 0;

      return;
    };

    gameTree.createTree = function () {
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

    gameTree.toSGF = function () {
      return this.tree;
    };

    gameTree.toJSON = function () {
      return this.tree;
    };

    gameTree.getHeight = function () {
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

    gameTree.getWidth = function () {
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
      }([this.tree]));

      return found;
    };

    gameTree.getRelativeDepth = function () {
      return this.current.depth !== 0 ? this.current.depth-1 : 0;
    };

    gameTree.getCurrentDepth = function () {
      return this.current.baseDepth+this.getRelativeDepth();
    };

    gameTree.getCurrent = function () {
      return this.current.sequence[this.getRelativeDepth()];
    };

    gameTree.setCurrent = function (node) {
      this.current.sequence[this.getRelativeDepth()] = node;
    };

    gameTree.rewind = function () {
      this.current = this;
      this.depth = 0;
      this.index = 0;
      return this;
    };

    gameTree.next = function () {
      var current = this.current;

      if ( current.depth >= current.sequence.length ) {
        while ( current ) {
          if ( current.index < current.children.length ) {
            current = this.create(
              current.children[current.index++], current,
              { lastVisited: this.current }
            );
            this.current = current;
            break;
          }
          current = current.parent;
        }
        if ( !current ) {
          return;
        }
      }

      current.index = 0;

      return current.sequence[current.depth++];
    };

    gameTree.hasNext = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        return true;
      }

      while ( current ) {
        if ( current.index < current.children.length ) {
          return true;
        }
        current = current.parent;
      }

      return false;
    };

    gameTree.peek = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        return current.sequence[current.depth];
      }

      while ( current ) {
        if ( current.index < current.children.length ) {
          return current.children[current.index][0][0];
        }
        current = current.parent;
      }

      return;
    };

    gameTree.previous = function () {
      var current = this.current;
      var lastVisited = current.lastVisited;

      if ( current.depth > 1 ) {
        current.index = 0;
        current.depth -= 1;
        return current.sequence[current.depth-1];
      }

      if ( lastVisited ) {
        this.current = lastVisited;
        return lastVisited.sequence[lastVisited.depth-1];
      }

      return;
    };

    gameTree.hasPrevious = function () {
      return this.current.depth > 1 || !!this.current.lastVisited;
    };

    gameTree.lookBack = function () {
      var current = this.current;
      var lastVisited = current.lastVisited;

      if ( current.depth > 1 ) {
        return current.sequence[current.depth-2];
      }

      if ( lastVisited ) {
        return lastVisited.sequence[lastVisited.depth-1];
      }

      return;
    };

    gameTree.getRelativeIndex = function () {
      return this.current.index !== 0 ? this.current.index-1 : 0;
    };

    gameTree.getRelativeIndexOf = function (node) {
      var children = this.getChildren();

      for ( var i = 0; i < children.length; i++ ) {
        if ( children[i] === node ) {
          return i;
        }
      }

      return -1;
    };

    gameTree.getCurrentIndex = function () {
      return this.current.baseIndex+this.getRelativeIndex();
    };

    gameTree.getCurrentChild = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        return current.sequence[this.getCurrentDepth()+1];
      }

      if ( current.children.length ) {
        return current.children[this.getRelativeIndex()][0][0];
      }

      return;
    };

    gameTree.nextChild = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        if ( current.index < 1 ) {
          current.index += 1;
          return current.sequence[current.depth];
        }
        return;
      }

      if ( current.index < current.children.length ) {
        return current.children[current.index++][0][0];
      }

      return;
    };

    gameTree.hasNextChild = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        return current.index < 1;
      }

      return current.index < current.children.length;
    };

    gameTree.peekChild = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        if ( current.index < 1 ) {
          return current.sequence[current.depth];
        }
        return;
      }

      if ( current.index < current.children.length ) {
        return current.children[current.index][0][0];
      }

      return;
    };

    gameTree.previousChild = function () {
      var current = this.current;

      if ( current.depth >= current.sequence.length &&
           current.index > 1 ) {
        current.index -= 1;
        return current.children[current.index-1][0][0];
      }

      return;
    };

    gameTree.hasPreviousChild = function () {
      return this.current.depth >= this.current.sequence.length &&
             this.current.index > 1;
    };

    gameTree.lookBackChild = function () {
      var current = this.current;

      if ( current.index > 1 ) {
        return current.children[current.index-2][0][0];
      }

      return;
    };

    gameTree.insertChild = function (tree) {
      return this.insertChildAt( this.getCurrentIndex(), tree );
    };

    gameTree.appendChild = function (tree) {
      return this.insertChildAt( this.getChildCount(), tree );
    };

    gameTree.insertChildAt = function (index, tree) {
      var current = this.current;
      var sequence = current.sequence;
      var children = current.children;

      if ( !isInteger ) {
        index = this.getRelativeIndexOf(index);
      }

      if ( index < 0 || index > this.getChildCount() ) {
        throw new Error("Index out of bounds: "+index);
      }

      if ( tree && typeof tree === "object" && isArray(tree.tree) ) {
        tree = tree.tree;
      }
      else if ( !isArray(tree) ) {
        tree = [[tree], []];
      }

      if ( current.depth >= sequence.length && !children.length ) {
        push.apply( sequence, tree[0] );
        push.apply( children, tree[1] );
        return;
      }

      if ( current.depth > 1 && current.depth < sequence.length ) {
        children.push([
          sequence.splice(current.depth),
          children.splice(0)
        ]);
      }

      children.splice( index, 0, tree );

      return;
    };

    gameTree.removeChild = function () {
      return this.removeChildAt( this.getRelativeIndex() );
    };

    gameTree.removeChildAt = function (index) {
      var current = this.current;
      var sequence = current.sequence;
      var children = current.children;
      var tree;

      if ( !isNumber(index) || Math.floor(index) !== index ) {
        index = this.getRelativeIndexOf(index);
      }

      if ( index < 0 || index >= this.getChildCount() ) {
        throw new Error("Index out of bounds: "+index);
      }

      if ( current.depth < sequence.length ) {
        tree = [
          sequence.splice( this.getCurrentDepth()+1 ),
          children.splice(0)
        ];
        current.depth = Math.min( current.depth, sequence.length );
        current.index = 0;
      }
      else {
        tree = children.splice( index, 1 );
        current.index = Math.min( current.index, children.length );
      }
 
      return this.create(tree);
    };

    gameTree.replaceChild = function (tree) {
      return this.replaceChildAt( this.getRelativeIndex(), tree );
    };

    gameTree.replaceChildAt = function (index, tree) {
      index = isInteger(index) ? index : this.getRelativeIndexOf(index);
      var gameTree = this.removeChildAt( index );
      this.insertChildAt( index, tree );
      return gameTree;
    };

    gameTree.isLeaf = function () {
      return this.current.children.length === 0 &&
             this.current.depth >= this.current.sequence.length;
    };

    gameTree.isRoot = function () {
      return !this.current.parent && this.current.depth <= 1;
    };

    gameTree.getChildren = function () {
      var current = this.current;
      var children = current.children;
      var nodes = [];

      if ( current.depth < current.sequence.length ) {
        nodes.push( current.sequence[current.depth] );
      }
      else {
        for ( var i = 0; i < children.length; i++ ) {
          nodes.push( children[i][0][0] );
        }
      }

      return nodes;
    };

    gameTree.getChildCount = function () {
      var current = this.current;

      if ( current.depth < current.sequence.length ) {
        return 1;
      }

      return current.children.length;
    };

    gameTree.getSiblings = function () {
      var current = this.current;
      var siblings = current.parent && current.parent.children;
      var nodes = [];

      if ( current.depth > 1 ) {
        nodes.push( current.sequence[current.depth-1] );
      }
      else if ( siblings ) {
        for ( var i = 0; i < siblings.length; i++ ) {
          nodes.push( siblings[i][0][0] );
        }
      }

      return nodes;
    };

    gameTree.getParent = function () {
      var current = this.current;
      var parent = current.parent;

      if ( current.depth > 1 ) {
        return current.sequence[current.depth-2];
      }
      else if ( parent ) {
        return parent.sequence[parent.depth];
      }

      return;
    };

    return function (tree) {
      return gameTree.create(tree);
    };
  }());

}());

