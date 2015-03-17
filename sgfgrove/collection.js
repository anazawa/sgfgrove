(function () {

  var SGFGrove;

  if ( typeof exports !== "undefined" ) {
    SGFGrove = require("../sgfgrove.js");
  }
  else {
    SGFGrove = window.SGFGrove;
  }

  SGFGrove.Collection = function () {};

  SGFGrove.Collection.GameTree = (function () {
    var GameTree = function (tree, parent) {
      this.parent = parent;
      this.gameTree = this;
      this.sequence = tree[0];
      this.index = 0;
      this.variations = tree[1];
      this.variationIndex = 0;
    };

    GameTree.prototype.buildGameTree = function (tree, parent) {
      return new GameTree( tree, parent );
    };

    GameTree.prototype.accept = function (visitor) {
      if ( visitor && typeof visitor === "object" &&
           typeof visitor.visit === "function" ) {
        return visitor.visit(this);
      }
    };

    GameTree.prototype.getNext = function () {
      var gameTree = this.gameTree;

      if ( gameTree.index < gameTree.sequence.length ) {
        return gameTree.sequence[gameTree.index++];
      }

      while ( gameTree ) {
        if ( gameTree.variationIndex < gameTree.variations.length ) {
          this.gameTree = this.buildGameTree(
            gameTree.variations[gameTree.variationIndex++],
            gameTree
          );
          return this.getNext();
        }
        gameTree = gameTree.parent;
      }

      return;
    };

    GameTree.prototype.hasNext = function () {
       var gameTree = this.gameTree;

      if ( gameTree.index < gameTree.sequence.length ) {
        return true;
      }

      while ( gameTree ) {
        if ( gameTree.variationIndex < gameTree.variations.length ) {
          return true;
        }
        gameTree = gameTree.parent;
      }

      return false;
    };

    // XXX
    GameTree.prototype.getPrevious = function () {
      var gameTree = this.gameTree;
      var tree;

      if ( gameTree.index > 0 ) {
        return gameTree.sequence[--gameTree.index];
      }

      if ( gameTree = gameTree.parent ) {
        if ( gameTree.variationIndex > 1 ) {
          gameTree.variationIndex--;
          tree = this.buildGameTree( gameTree.variations[gameTree.variationIndex-1] );
          tree.getLast();
          tree.parent = gameTree;
          gameTree = tree.gameTree;
        }
        this.gameTree = gameTree;
        return this.getPrevious();
      }

      return;
    };

    GameTree.prototype.getFirst = function () {
      this.gameTree = this;
      this.index = 0;
      this.variationIndex = 0;
      return this.getNext();
    };

    GameTree.prototype.getLast = function () {
      while ( this.getNext() ) {}
      return this.getCurrent();
    };

    GameTree.prototype.getCurrentIndex = function () {
      return this.gameTree.index !== 0 ? this.gameTree.index-1 : 0;
    };

    GameTree.prototype.getCurrentVariationIndex = function () {
      var parent = this.gameTree.parent || this.gameTree;
      return parent.variationIndex !== 0 ? parent.variationIndex-1 : 0;
    };

    GameTree.prototype.getCurrent = function () {
      return this.gameTree.sequence[this.getCurrentIndex()];
    };

    GameTree.prototype.getCurrentVariation = function () {
      var parent = this.gameTree.parent || this.gameTree;
      return parent.variations[this.getCurrentVariationIndex()];
    };

    GameTree.prototype.getAbsoluteIndex = function () {
      var gameTree = this.gameTree;
      var index = gameTree.getCurrentIndex();

      while ( gameTree = gameTree.parent ) {
        index += gameTree.sequence.length;
      }

      return index;
    };

    GameTree.prototype.getAbsoluteVariationIndex = function () {
      var current = this.getCurrentVariation();
      var found = 0;

      (function findLeaf (variations) {
        for ( var i = 0; i < variations.length; i++ ) {
          if ( variations[i] === current ) {
            return false;
          }
          if ( variations[i][1].length === 0 ) {
            found += 1;
          }
          else {
            var ret = findLeaf( variations[i][1] );
            if ( ret === false ) { return ret; }
          }
        }
      }(this.variations));

      return found;
    };

    GameTree.prototype.getHeight = function () {
      var max = 0;

      (function findLeaf (variations, height) {
        for ( var i = 0; i < variations.length; i++ ) {
          var h = height + variations[i][0].length;
          if ( variations[i][1].length === 0 ) {
            max = h > max ? h : max;
          }
          else {
            findLeaf( variations[i][1], h );
          }
        }
      }(this.variations, 0));

      return max;
    };

    GameTree.prototype.getWidth = function () {
      var found = 0;

      (function findLeaf (variations) {
        for ( var i = 0; i < variations.length; i++ ) {
          if ( variations[i][1].length === 0 ) {
            found += 1;
          }
          else {
            findLeaf( variations[i][1] );
          }
        }
      }(this.variations));

      return found;
    };

    GameTree.prototype.isLeaf = function () {
      return this.gameTree.variations.length === 0 &&
             this.gameTree.index === this.gameTree.sequence.length;
    };

    GameTree.prototype.isRoot = function () {
      return !this.parent && this.getCurrentIndex() === 0;
    };

    GameTree.prototype.replace = function (node) {
      this.gameTree.sequence[this.getCurrentIndex()] = node;
    };

    GameTree.prototype.remove = function () {
      var gameTree = this.gameTree;
      var parent = gameTree.parent;
      var node;

      if ( !parent && gameTree.sequence.length === 1 ) {
        throw new Error("GameTree must contain at least one node");
      }

      node = gameTree.sequence.splice(this.getCurrentIndex(), 1)[0];

      if ( gameTree.index > gameTree.sequence.length ) {
        gameTree.index = gameTree.sequence.length;
      }

      if ( gameTree.sequence.length ) {
        return node;
      }

      // merge gameTree.variations into parent.variations
      Array.prototype.splice.apply(
        parent.variations,
        [].concat( this.getCurrentVariationIndex(), 1, gameTree.variations )
      );

      if ( parent.variationIndex > parent.variations.length ) {
        parent.variationIndex = parent.variations.length;
      }

      if ( parent.variations.length ) {
        this.gameTree = this.buildGameTree(
          this.getCurrentVariation(),
          parent
        );
      }
      else {
        this.gameTree = parent;
      }

      return node;
    };

    GameTree.prototype.insert = function (node) {
      this.gameTree.sequence.splice(this.getCurrentIndex(), 0, node);
    };

    GameTree.prototype.push = function (node) {
      while ( !this.isLeaf() ) { this.getNext(); }
      this.gameTree.sequence.push( node );
      this.getNext();
    };

    GameTree.prototype.pop = function () {
      while ( !this.isLeaf() ) { this.getNext(); }
      return this.remove();
    };

    GameTree.prototype.shift = function () {
      this.getFirst();
      return this.remove();
    };

    GameTree.prototype.unshift = function (node) {
      this.getFirst();
      this.insert(node);
    };

    return GameTree;
  }());

}());
