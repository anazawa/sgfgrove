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
      this.tree = tree || [[{}], []];
      this.parent = parent;
      this.gameTree = this;
      this.sequence = this.tree[0];
      this.index = 0;
      this.variations = this.tree[1];
      this.variationIndex = 0;
    };

    GameTree.prototype.buildGameTree = function (tree, parent) {
      return new GameTree( tree, parent );
    };

    GameTree.prototype.clone = function () {
      var clone = this.buildGameTree( this.tree, this.parent );

      clone.index = this.index;
      clone.variationIndex = this.variationIndex;

      if ( this.gameTree !== this ) {
        clone.gameTree = this.gameTree.clone();
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
      this.gameTree = this;
      this.index = 0;
      this.variationIndex = 0;
      return this;
    };

    GameTree.prototype.getNext = function () {
      var gameTree = this.gameTree;

      if ( gameTree.index < gameTree.sequence.length ) {
        return gameTree.sequence[gameTree.index++];
      }

      if ( gameTree.variationIndex < gameTree.variations.length ) {
        this.gameTree = this.buildGameTree(
          gameTree.variations[gameTree.variationIndex++],
          gameTree
        );
        return this.getNext();
      }

      return;
    };

    GameTree.prototype.hasNext = function () {
      return this.gameTree.index < this.gameTree.sequence.length ||
             this.gameTree.variationIndex < this.gameTree.variations.length;
    };

    GameTree.prototype.peek = function () {
      var gameTree = this.gameTree;

      if ( gameTree.index < gameTree.sequence.length ) {
        return gameTree.sequence[gameTree.index];
      }

      if ( gameTree.variationIndex < gameTree.variations.length ) {
        return gameTree.variations[gameTree.variationIndex][0][0];
      }

      return;
    };

    GameTree.prototype.getNextVariation = function () {
      var gameTree = this.gameTree;
      var variation;

      while ( gameTree ) {
        if ( gameTree.variationIndex < gameTree.variations.length ) {
          variation = gameTree.variations[gameTree.variationIndex++];
          this.gameTree = this.buildGameTree( variation, gameTree );
          this.getNext();
          break;
        }
        gameTree = gameTree.parent;
      }

      return variation;
    };

    GameTree.prototype.getPrevious = function () {
      var gameTree = this.gameTree;

      if ( gameTree.index > 1 ) {
        gameTree.index -= 1;
        return gameTree.sequence[gameTree.index-1];
      }

      return;
    };

    GameTree.prototype.getPreviousVariation = function () {
      var gameTree = this.gameTree.parent;
      var variation;

      if ( !gameTree ) {
        return;
      }

      if ( gameTree.variationIndex > 1 ) {
        gameTree.variationIndex--;
        while ( gameTree.variations.length ) {
          variation = gameTree.variations[gameTree.variationIndex-1];
          gameTree = this.buildGameTree( variation, gameTree );
          gameTree.index = gameTree.sequence.length;
          gameTree.variationIndex = gameTree.variations.length;
        }
      }

      this.gameTree = gameTree;

      return variation || this.getCurrentVariation();
    };

    GameTree.prototype.getFirst = function () {
      return this.rewind().getNext();
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

    GameTree.prototype.setCurrent = function (node) {
      this.gameTree.sequence[this.getCurrentIndex()] = node;
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

    GameTree.prototype.setAbsoluteIndex = function (index) {
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
      var that = this;

      if ( !that.isLeaf() ) {
        that = that.clone();
        that.getLast();
      }

      that.gameTree.sequence.push(node);

      return;
    };

    GameTree.prototype.pop = function (node) {
      var that = this;

      if ( !that.isLeaf() ) {
        that = that.clone();
        that.getLast();
      }

      return that.remove();
    };

    GameTree.prototype.shift = function (node) {
      var that = this.isRoot() ? this : this.buildGameTree( this.tree );
      return that.remove();
    };

    GameTree.prototype.unshift = function (node) {
      var that = this.isRoot() ? this : this.buildGameTree( this.tree );
      return that.insert(node);
    };

    return GameTree;
  }());

}());
