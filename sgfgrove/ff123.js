(function () {
    "use strict";

    var SGFGrove;

    if ( typeof exports !== "undefined" ) {
        SGFGrove = require("../sgfgrove.js"); // jshint ignore:line
    }
    else {
        SGFGrove = window.SGFGrove;
    }

    // Original File Format
    // http://www.red-bean.com/sgf/ff1_3/ff1.html
    SGFGrove.define(1, null, function (FF) {
        var create = SGFGrove.Util.create;
        var Types = create( FF.Types );

        Types.Color   = FF[4].Types.Color;
        Types.None    = FF[4].Types.None;
        Types.listOf  = FF[4].Types.listOf;
        Types.elistOf = FF[4].Types.elistOf;

        Types.Triple = create( FF[4].Types.Double );
        Types.Triple.name = "Triple";

        // Real = Number ["." {Digit}]
        Types.Real = Types.scalar({
            name: "Real",
            like: /^[+-]?\d+(?:\.\d*)?$/,
            isa: SGFGrove.Util.isNumber,
            parse: parseFloat
        });

        // Text = { any charcter; "\]" = "]", "\\" = "\"}
        Types.Text = Types.scalar({
            name: "Text",
            parse: function (v) { return v.replace(/\\([\]\\])/g, "$1"); },
            stringify: function (v) { return v.replace(/([\]\\])/g, "\\$1"); }
        });

        this.Types = Types;

        this.properties = function (t) {
            t = t || Types;

            var that = FF.properties(t, {
                identifiers: /^[A-Z][A-Z0-9]?$/
            });

            that.merge({
                B  : t.Move,
                W  : t.Move,
                C  : t.Text,
                N  : t.Text,
                //
                V  : t.Number,
                //
                CH : t.Triple,
                GB : t.Triple,
                GW : t.Triple,
                TE : t.Triple,
                BM : t.Triple,
                // times
                BL : t.Real,
                WL : t.Real,
                // figure
                FG : t.None,
                // set up
                AB : t.listOf(t.Point),
                AW : t.listOf(t.Point),
                AE : t.listOf(t.Point),
                PL : t.Color,
                // game info
                GN : t.Text, 
                GC : t.Text,
                EV : t.Text,
                RO : t.Text,
                DT : t.Text,
                PC : t.Text,
                PB : t.Text,
                PW : t.Text,
                RE : t.Text,
                US : t.Text,
                TM : t.Text,
                SO : t.Text,
                // root
                GM : t.Number,
                SZ : t.Number,
                VW : t.elistOf(t.Point), // "an empty list denotes the whole board"
                BS : t.Number,
                WS : t.Number,
                // computer algorithms
                EL : t.Number,
                EX : t.Move,
                // marking
                SL : t.listOf(t.Point),
                M  : t.listOf(t.Point),
                L  : t.listOf(t.Point)
            });

            return that;
        };

        return;
    });

    // Go (;GM[1]) specific properties
    // http://www.red-bean.com/sgf/ff1_3/ff1.html
    SGFGrove.define(1, 1, function (FF) {
        var Types = SGFGrove.Util.create( FF[1].Types );

        Types.Point = Types.scalar({
            name: "Point",
            like: /^[a-s]{2}$/
        });

        Types.Move = Types.scalar({
            name: "Move",
            like: /^(?:[a-s]{2}|tt)$/
        });

        this.Types = Types;

        this.properties = function (t) {
            t = t || Types;

            return FF[1].properties(t).merge({
                BR : t.Text,
                WR : t.Text,
                HA : t.Number,
                KM : t.Real,
                TB : t.listOf(t.Point),
                TW : t.listOf(t.Point),
                SC : t.listOf(t.Point),
                RG : t.listOf(t.Point)
            });
        };

        return;
    });

    // "FF[2] was never made public. It's more or less identical to FF[1] -
    // the only changes known (to me) are that the BS/WS values had been
    // redefined." (http://www.red-bean.com/sgf/proplist_ff.html)
    SGFGrove.define(2, null, function (FF) {
        return FF[1];
    });

    // File Format (;FF[3])
    // http://www.red-bean.com/sgf/ff1_3/ff3.html
    // http://www.red-bean.com/sgf/ff1_3/sgfhistory.html
    SGFGrove.define(3, null, function (FF) {
        var Types = SGFGrove.Util.create( FF[1].Types );

        Types.compose = FF[4].Types.compose;

        this.Types = Types;

        this.properties = function (args) {
            var t = args || Types;

            return FF.properties(t).merge({
                // Moves
                B  : t.Move,
                W  : t.Move,
                // Setup Position or Problem
                AB : t.listOf(t.Point),
                AW : t.listOf(t.Point),
                AE : t.listOf(t.Point),
                PL : t.Color,
                // Node Annotation
                C  : t.Text,
                N  : t.Text,
                SE : t.listOf(t.Point),
                // Move Annotation
                V  : t.Real,
                CH : t.Triple,
                GB : t.Triple,
                GW : t.Triple,
                TE : t.Triple,
                BM : t.Triple,
                DO : t.None,
                IT : t.None,
                UC : t.Triple,
                DM : t.Triple,
                HO : t.Triple,
                SI : t.Triple,
                // Time Control
                BL : t.Real,
                WL : t.Real,
                OB : t.Number,
                OM : t.Number,
                OP : t.Real,
                OV : t.Number,
                OW : t.Number,
                // Diagrams and Printing
                FG : t.None,
                MN : t.Number,
                // Root Properties
                FF : t.Number,
                GM : t.Number,
                SZ : t.Number,
                BS : t.Number,
                WS : t.Number,
                LT : t.None,
                // Game Info
                GN : t.Text,
                GC : t.Text,
                EV : t.Text,
                RO : t.Text,
                DT : t.Text,
                PC : t.Text,
                PB : t.Text,
                PW : t.Text,
                BT : t.Text,
                WT : t.Text,
                RE : t.Text,
                US : t.Text,
                TM : t.Text,
                SO : t.Text,
                AN : t.Text,
                CP : t.Text,
                ID : t.Text,
                ON : t.Text,
                // Position Annotation
                SL : t.listOf(t.Point),
                MA : t.listOf(t.Point),
                TR : t.listOf(t.Point),
                CR : t.listOf(t.Point),
                LB : t.listOf( t.compose(t.Point, t.Text) )
            });
        };

        return;
    });

    // Go (;FF[3]GM[1]) specific properties
    SGFGrove.define(3, 1, function (FF) {
        var Types = SGFGrove.Util.create( FF[3].Types );

        Types.Point = FF[1][1].Types.Point;
        Types.Move  = FF[1][1].Types.Move;

        this.Types = Types;
        
        this.properties = function (args) {
            var t = args || Types;

            return FF[3].properties(t).merge({
                KO : t.None,
                RU : t.Text,
                BR : t.Text,
                WR : t.Text,
                HA : t.Number,
                KM : t.Real,
                TB : t.listOf(t.Point),
                TW : t.listOf(t.Point),
                TC : t.Number,
                SC : t.listOf(t.Point),
                RG : t.listOf(t.Point)
            });
        };

        return;
    });

}());

