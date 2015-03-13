# SGFGrove.js

Type-aware SGF parser/stringifier that supports only FF[4]

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
```

In your JavaScript:

```js
SGFGrove.parse("(;FF[4]B[pd];W[qp])");
// => [[
//     [{ FF: 4, B: "pd" },
//      { W: "qp" }],
//     []
// ]]

SGFGrove.stringify([[
    [{ FF: 4, B: "pd" },
     { W: "qp" }],
    []
]]);
// => "(;FF[4]B[pd];W[qp])"
```

## Description

This module allows you to parse SGF, Smart Game Format, into a simple
JavaScript data structure and back again. The data structure follows
the original format very closely. You can also convert the strucuture into
JSON by using JSON.stringify without any modifications.

The supported SGF versions are as follows:

- FF[4]

The supported game types are as follows:

- GM\[1] (Go)

SGF defines various types of property values. This module maps the type into
the appropriate JavaScript type. See "SGF Properties" for details.

### Methods

#### array = SGFGrove.parse( string[, reviver] )

Given a SGF string, returns an array representing a SGF collection.
You can also pass a callback function that is used to filter properties.
The callback is called with the object containing the property being
processed as `this` and with the name of the property and the value
as `arguments`. The return value is used to override the existing
property value. If the callback returns `undefined`, then the property
will be deleted.
  
While an invalid SGF is rejected, e.g., `(;FF[four])`, this method
does not care about the meaning of the given SGF property,
but the format of the property. In other words, it allows you to
parse a meaningless syntactically-correct SGF, such as
`(;FF[4]SZ[1]B[ZZ])`. You have to check the meanings by yourself.
   
This method neither checks the `CA` (charset) property of the given
SGF string nor decodes the encoded properties, such as `C` (comment).
You have to decode them by yourself.
   
This method does not convert HTML special characters in text properties
into their entity equivalents. You have to escape them by yourself.

#### string = SGFGrove.stringify( array[, replacer, space] )

Given an array representing a SGF collection, returns a SGF string.
If a property name does not look like SGF, the property will be ignored
silently. In other words, that property is considered user-defined.
For example, "FOO" and "FOOBAR" are valid FF[4] property names.
"foo", "fooBar" and "foo_bar" are ignored. If a property value has
`toSGF` method, the value is replaced with the return value of the method.

### The Game Data Structure

A SGF collection is represented by an array containing SGF game trees.
Each game tree is an array consisting of an array of SGF nodes and an array
of sub game trees, called variations/branches/alternate lines of play.
Each node is simply an object. Each SGF property is stored in the object
with the property name as the key, and the property value(s) for the
value.

    Collection:
    
        [
            [GameTree],
            [GameTree],
            ...
            [GameTree]
        ]
    
    GameTree:
    
        [
            [
                {Node},
                {Node},
                ...
                {Node}
            ],
            [
                [GameTree],
                [GameTree],
                ...
                [GameTree]
            ]
        ]

    Node:
    
        {
            FF: 4,
            B: "pd"
        }

You can also convert the above data structure to JSON:

```js
JSON.stringify( SGFGrove.parse("(;FF[4])") );
// => JSON representaion of SGF
```

#### Why Not Usual Tree Structure?

Because it's optimized for a go game record played by human being
with some variations. That's why the data structure is simplified,
*considering a SGF sequence as the node of the tree*.
It's not appropriate for editing but replaying.

## Examples

### Coordinate Transformation
  
```js
var char2coord = { "a": 0, "b": 1, ... };

SGFGrove.parse("(;FF[4]B[ab];W[ba])", function (key, value) {
    if ( key === "B" || key === "W" ) {
        var x = value.charAt(0);
        var y = value.charAt(1);
        return [ char2coord[x], char2coord[y] ];
    }
    else {
        return value;
    }
});
// => [[
//   [{ FF: 4, B: [0, 1] },
//    { W: [1, 0] }],
//   []
// ]]
```

```js
var coord2char = [ "a", "b", ... ];

var sgf = [[
    [{ FF: 4, B: [0, 1] },
     { W: [1, 0] }],
    []
]];

SGFGrove.stringify(sgf, function (key, value) {
    if ( key === "B" || key === "W" ) {
        var x = coord2char[ value[0] ];
        var y = coord2char[ value[1] ];
        return x + y; // => "a"+"b" => "ab"
    }
    else {
        return value;
    }
});
// => "(;FF[4]B[ab];W[ba])"
```

### Remove Comments

```js
SGFGrove.parse("(;FF[4]C[foo: hi\nbar: gg])", function (key, value) {
  if ( key !== "C" ) { // exclude the C property
    return value;
  }
});
// => [[
//   [{ FF: 4 }],
//   []
// ]]
```

### User-defined Properties are ignored

```js
SGFGrove.stringify([[
    [{
        FF: 4,
        foo: "bar" // ignored
    }],
    []
]]);
// => "(;FF[4])"
```

### Using toSGF Method

```js
SGFGrove.stringify([[
    [{
        FF: 4,
        FOO: {
            bar: "baz",
            toSGF: function () {
                return [ this.bar ];
            }
        }
    }],
    []
]]);
// => "(;FF[4]FOO[baz])"
```

### Select properties

```js
var sgf = [[
    [{ FF: 4, B: "pd", C: "foo: hi" },
     { W: "qp", C: "bar: gg" }],
    []
]];
 
// FF, B and W are included, while C is excluded
SGFGrove.stringify(sgf, ["FF", "B", "W"]);
// => "(;FF[4]B[pd];W[qp])"
```

### GameTree Traversal

```js
var trees = SGFGrove.parse("(;FF[4])"); // => [Collection]
var nodeId = 0;

(function walk (subtrees) {
    subtrees;
    // => [
    //     [GameTree],
    //     [GameTree],
    //     ...
    //     [GameTree]
    // ]
   
    for ( var i = 0; i < subtrees.length; i++ ) {
        var subtree = subtrees[i];
        // => [
        //     [{Node}, {Node}, ..., {Node}],
        //     [[GameTree], [GameTree], ..., [GameTree]]
        // ]

        var sequence = subtree[0];
        // => [{Node}, {Node}, ..., {Node}]
   
        if ( subtrees === trees ) {
            // 'subtree' is the direct descendant of Collection,
            // not trees within other trees
   
            // one of root nodes
            sequence[0];
            // => {
            //     FF: 4
            // }
        }
   
        for ( var j = 0; j < sequence.length-1; j++ ) {
            var node = sequence[j];
   
            node.id = nodeId; // assign node id
  
            node; 
            // => {
            //     id: 0,
            //     FF: 4
            // }
   
            nodeId += 1;
        }
   
        // subtree[1] refers to sub subtrees
        walk( subtree[1] );
    }
}(trees));
```

### SGF Properties

#### FF[4]

    SGF                   JavaScript            Notes
    ------------------------------------------------------------------
    AN[annotator]         "annotator"
    AP[app:version]       ["app", "version"]
    BM[1], BM[2]          1, 2
    BR[black rank]        "black rank"
    BT[black team]        "black team"
    C[comment]            "comment"
    CA[charset]           "charset"
    CP[copyright]         "copyright"
    DM[1], DM[2]          1, 2
    DO[]                  null
    DT[YYYY-MM-DD]        "YYYY-MM-DD"
    EV[event]             "event"
    FF[1]-FF[4]           1-4
    FG[], FG[257:fig]     null, [257, "fig"]
    GB[1], GB[2]          1, 2
    GC[game comment]      "game comment"
    GM[1]-                1-
    GN[game name]         "game name"
    GW[1], GW[2]          1, 2
    HO[1], HO[2]          1, 2
    IT[]                  null
    KO[]                  null
    MN[123]               123
    N[node name]          "node name"
    ON[opening]           "opening"
    OT[overtime]          "overtime"
    PB[black player]      "black player"
    PC[place]             "place"
    PL[B], PL[W]          "B", "W"
    PM[0]-PM[2]           0-2
    PW[white player]      "white player"
    RE[result]            "result"
    RO[round]             "round"
    RU[rules]             "rules"
    SO[source]            "source"
    ST[0]-ST[3]           0-3
    SZ[1]-, SZ[12:34]     1-, [12, 34]
    TE[1], TE[2]          1, 2
    UC[1], UC[2]          1, 2
    US[user]              "user"
    V[1.23]               1.23
    WR[white rank]        "white rank"
    WT[white team]        "white team"

#### FF[4]GM\[1] (Go)

    SGF                   JavaScript            Notes
    ------------------------------------------------------------------
    AB[aa][bb]            ["aa", "bb"]          compressible
    AE[aa][bb]            ["aa", "bb"]          compressible
    AR[aa:bb]             [["aa", "bb"]]
    AW[aa][bb]            ["aa", "bb"]          compressible
    B[aa]-B[ZZ], B[]      "aa"-"ZZ", null
    CR[aa][bb]            ["aa", "bb"]          compressible
    DD[], DD[aa][bb]      [], ["aa", "bb"]      compressible
    HA[2]-                2-
    KM[6.5]               6.5
    LB[aa:label]          [["aa", "label"]]      
    LN[aa:bb]             [["aa", "bb"]]    
    MA[aa][bb]            ["aa", "bb"]          compressible
    SL[aa][bb]            ["aa", "bb"]          compressible
    SQ[aa][bb]            ["aa", "bb"]          compressible
    TB[], TB[aa][bb]      [], ["aa", "bb"]      compressible
    TR[aa][bb]            ["aa", "bb"]          compressible
    TW[], TW[aa][bb]      [], ["aa", "bb"]      compressible
    VW[], VW[aa][bb]      [], ["aa", "bb"]      compressible
    W[aa]-W[ZZ], W[]      "aa"-"ZZ", null
    
    compressible:
      Compressed point lists are expanded by the parse method automatically,
      i.e. AB[aa:bb][cc] is converted to ["aa", "ba", "ab", "bb", "cc"].
      NOTE: The stringify method does not compress the expanded point      
      lists at this time (even if it's not compressed, that SGF does not
      violate the SGF specification).

#### Unknown Properties

Unknown properties are converted into an array of strings.
When parsing, closing brackets in the property value must be escaped.
When stringifying, closing brackets in the given string will be escaped
by this module.

```js
SGFGrove.parse("(;FF[4]UNKNOWN[foo][bar:baz][123][])");
// => [[
//     [{
//         FF: 4,
//         UNKNOWN: ["foo", "bar:baz", "123", ""]
//     }],
//     []
// ]]
```

```js
SGFGrove.stringify([[
    [{
        FF: 4,
        UNKNOWN: ["foo", "bar:baz", "123", ""]
        //UNKNOWN: "foo" => TypeError
        //UNKNOWN: ["foo", ["bar", "baz"], 123, null] => TypeError
    }],
    []
]]);
// => "(;FF[4]UNKNOWN[foo][bar:baz][123][])"
```

## History

The data structure of a SGF collection is based on Games::Go::SGF::Grove,
a Perl module on CPAN:

  https://metacpan.org/pod/Games::Go::SGF::Grove

Some modifications were made to the original structure by the author,
and so this module is not compatible with Perl one.

## Other SGF Parsers

### [smartgame](https://github.com/neagle/smartgame)

This module comes with "smartgamer" that allows you to edit/iterate through
the smartgame data structure. It seems very handy. SGFGrove.js is not
compatible with this module.

## See Also

- SGF Specification: http://www.red-bean.com/sgf/

## Acknowledgements

Thanks to yewang@github for his thoughtful comments on the data structure of
a game tree.

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

