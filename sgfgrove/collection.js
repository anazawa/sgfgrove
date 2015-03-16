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
      this.variations = tree[1];
      this.index = 0;
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
          this.gameTree = this.buildGameTree( gameTree.variations[gameTree.variationIndex++], gameTree );
          return this.getNext();
        }
        gameTree = gameTree.parent;
      }

      return;
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
      var variations = (this.gameTree.parent || this).variations;
      return variations[this.getCurrentVariationIndex()];
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

    return GameTree;
  }());

}());
