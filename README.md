# SGFGrove.js

Type-aware SGF parser/composer intended for the browser

[![Build Status](https://travis-ci.org/anazawa/sgfgrove.svg)](https://travis-ci.org/anazawa/sgfgrove)

- [Sysnopsis](#synopsis)
- [Description](#description)
    - [Methods](#methods)
    - [The Game Data Structure](#the-game-data-structure)
    - [SGF Property Types](#sgf-property-types)
    - [SGF Properties](#sgf-properties)
    - [SGF File Format Detection](#sgf-file-format-detection)
- [Diagnostics](#diagnostics)
- [Exapmles](#examples)
- [Requirements](#requirements)
- [Limitations](#limitations)
- [Versioning](#versioning)
- [History](#history)
- [See Also](#see-also)
- [Acknowledgements](#acknowledgements)
- [Author](#author)
- [License](#license)

## Synopsis

In your HTML:

```html
<script src="sgfgrove.js"></script>
<script src="sgfgrove/ff123.js"></script><!-- optional -->
```

In your JavaScript:

```js
SGFGrove.parse("(;FF[4];B[pd];W[qp])");
// => [[
//     [{ FF: 4 },
//      { B: "pd" },
//      { W: "qp" }],
//     []
// ]]

SGFGrove.stringify([[
    [{ FF: 4 },
     { B: "pd" },
     { W: "qp" }],
    []
]]);
// => "(;FF[4];B[pd];W[qp])"
```

## Description

This module allows you to parse SGF, Smart Game Format, into a simple
JavaScript data structure and back again. The data structure follows
the original format very closely. You can also convert the strucuture into
JSON by using JSON.stringify without any modifications.

The supported SGF versions are as follows:

- FF[1] \(requires `sgfgrove/ff123.js`)
- FF[2] \(requires `sgfgrove/ff123.js`)
- FF[3] \(requires `sgfgrove/ff123.js`)
- FF[4]

The supported game types are as follows:

- GM[1] \(Go)

SGF defines various types of property values. This module maps the type into
the appropriate JavaScript type. See "SGF Properties" for details.

### Methods

#### array = SGFGrove.parse( string[, reviver] )

Given a SGF string, returns an array representing a SGF collection.
You can also pass the `reviver` parameter that will be used in the same way
as the JSON.parse method uses the parameter.

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

#### string = SGFGrove.stringify( array[, replacer[, space]] )

Given an array representing a SGF collection, returns a SGF string.
You can also pass the `replacer` and `space` parameters that will be used
in the same way as the JSON.stringify method uses the parameters,
except that the `toJSON` method is not invoked.

If a property name does not look like SGF, the property will be ignored
silently. In other words, that property is considered user-defined.
For example, "FOO" and "FOOBAR" are valid FF[4] property names.
"foo", "fooBar" and "foo_bar" are ignored. If a property value has
`toSGF` method, the value is replaced with the return value of the method.

#### fileFormat = SGFGrove.fileFormat({ FF: ff[, GM: gm] })

#### SGFGrove.fileFormat({ FF: ff[, GM: gm] }, function (FF) {...})

Can be used to get or set game-specific types and properties.
It's intended for those who writes extensions for this module.
See the source code for details.

This module only comes with the FF[4] definition and the default game type
GM[1] \(Go). Other file formats or game types are provided by the SGFGrove
extensions, such as [sgfgrove-ff123](https://github.com/anazawa/sgfgrove-ff123) that defines FF[1]-FF[3] properties.

#### SGFGrove.define( ff, gm, function (FF) {...} )

This method is obsolete and will be removed in `1.0.4`.
Use #fileFormat instead.

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
            C: "root"
        }

You can also convert the above data structure to JSON:

```js
JSON.stringify( SGFGrove.parse("(;FF[4])") );
// => JSON representaion of SGF
```

#### Why Not Usual Tree Structure?

Because it's simplified to avoid nesting the data unnecessarily, *considering
a SGF sequence as the node of the tree*, where a SGF sequence is a list of
SGF nodes. This simplification is based on an (not-so-reliable) observed fact
that the height of a SGF game tree tends to be much longer than the width,
the total number of leaves. Even tsumego/joseki, which generally has a lot of
variations, can be considered as a tree of sequences.

### SGF Property Types

#### FF[4]

##### Number

SGF Number is converted into JavaScript Number.

##### Real

SGF Real is converted into JavaScript Number.

##### Double

SGF Double is converted into JavaScript Number whose value can be either `1` or `2`.

##### Color

SGF Color is converted into JavaScript String whose value can be either `"B"` or `"W"`.

##### None

SGF None is converted into JavaScript `null`.

##### Text

SGF Text is converted into JavaScript String. Soft line breaks (linebreaks
preceded by a `\`) are removed. Hard line breaks (any other linebreaks
encoountered) are left untouched. When parsing, escaped characters are unescaped.
When stringifying, `]`, `\` and `:` are escaped by this module.

    SGF                   JavaScript            Notes
    ------------------------------------------------------------------
    C[hel\\nlo]           "hello"
    C[foo\nbar]           "foo\nbar"
    C[foo [2k\]]          "foo [2k]"

##### SimpleText

SGF SimpleText is converted into JavaScript String. Whitespaces (`\s`) other than
space (` `) are converted into space. Line breaks preceded by a `\` are removed.
When parsing, escaped characters are unescaped. When stringifying, `]`,
`\` and `:` are escaped by this module.

    SGF                   JavaScript            Notes
    ------------------------------------------------------------------
    PB[foo\\nbar]         "foo bar"
    PB[foo\nbar]          "foobar"

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

#### Unknown Game Types (GM)

Game-specific properties of the unknown game type, such as `B` or `W`,
are treated as an unknown property. You can also add game-specific types
and properties to this module by using the #define method.

#### Unknown File Formats (FF)

All the properties of the unknown file format are treated as an unknown
property.

### SGF File Format Detection

SGF file formats and game types are detected properly in most cases,
but corner cases exist because of the FF[3] PropIdent definition
that allows us to use lower-case letters in a PropIdent, such as `CoPyright`.

    SGF                 FF  GM  Notes
    ------------------------------------------------------------------
    (;)                  1   1
    (;FF[invalid])       1   1  FF prop. is unknown to FF[1]
    (;FF[1])             1   1
    (;FF[2])             2   1
    (;FF[3])             3   1
    (;FF[4])             4   1
    (;FileFormat[3])     -   -  Unsupported (cause SyntaxError)
    (;FF[3]GaMetype[2])  3   1  Unsupported (GM should be 2)

## Diagnostics

### SyntaxError: Unexpected token %s

You tried to #parse a malformed SGF text.

```js
SGFGrove.parse("(broken)"); // => SyntaxError
```

### SyntaxError: Property %s already exists

You tried to #parse a SGF node that has a duplicate property.
It's prohibited by the SGF specification.

```js
SGFGrove.parse("(;FF[4];B[aa]B[bb])"); // => SyntaxError
```

### SyntaxError: PropValue of %s is missing

You tried to #parse a property that has no value.

```js
SGFGrove.parse("(;FF[4];B)"); // => SyntaxError
```

### SyntaxError: GameTree does not contain any Nodes

You tried to #parse an empty game tree.
It's prohibited by the SGF specification.

```js
SGFGrove.parse("()"); // => SyntaxError
```

### SyntaxError: Invalid PropIdent %s

You tried to #parse a property whose identifier is invalid.

```js
SGFGrove.parse("(;FF[4]1NVALID[])"); // => SyntaxError
```

### SyntaxError: Invalid PropValue %s

You tried to #parse a property whose value is invalid.

```js
SGFGrove.parse("(;FF[4];B[invalid])"); // => SyntaxError
```

## Examples

### Coordinate Transformation
  
```js
var char2coord = { "a": 0, "b": 1, ... };

SGFGrove.parse("(;FF[4];B[ab];W[ba])", function (key, value) {
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
//   [{ FF: 4 },
//    { B: [0, 1] },
//    { W: [1, 0] }],
//   []
// ]]
```

```js
var coord2char = [ "a", "b", ... ];

var sgf = [[
    [{ FF: 4 },
     { B: [0, 1] },
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
// => "(;FF[4];B[ab];W[ba])"
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
var coord2char = [ "a", "b", ... ];

var Point = function (x, y) {
    this.x = x; // => 0
    this.y = y; // => 1
};

// convert user-defined Point object into SGF
Point.prototype.toSGF = function () {
    return coord2char[this.x] + coord2char[this.y]; // => "ab"
};

SGFGrove.stringify([[
    [{ FF: 4 },
     { B: new Point(0, 1) }], // toSGF method of Point object is called
    []
]]);
// => "(;FF[4];B[ab])"
```

### Select properties

```js
var sgf = [[
    [{ FF: 4 },
     { B: "pd", C: "foo: hi" },
     { W: "qp", C: "bar: gg" }],
    []
]];
 
// FF, B and W are included, while C is excluded
SGFGrove.stringify(sgf, ["FF", "B", "W"]);
// => "(;FF[4];B[pd];W[qp])"
```

### GameTree Traversal

```js
var collection = SGFGrove.parse("(;FF[4])"); // => [Collection]
var gameTree = collection[0]; // => [GameTree]

// Perform depth-first traversal on gameTree in pre-order
(function traverse(tree) {
    var sequence = tree[0]; // => [{Node}, {Node}, ..., {Node}]

    // iterate through sequence
    for (var i = 0; i < sequence.length; i++) {
        var node = sequence[i]; // => {Node}
        // do something with node
    }

    var children = tree[1]; // => [[GameTree], [GameTree], ..., [GameTree]]

    // iterate through children
    for (var j = 0; j < children.length; j++) {
        var child = children[j]; // => [GameTree]
        traverse(child); // step into child GameTree
    }
}(gameTree));
```

### Define Othello (FF[4]GM[2]) handlers

```js
// NOTE: the FF[4] spec does not come with the Othello definition,
// and so the following code may be wrong. This example is based on
// the FF[1] description (http://www.red-bean.com/sgf/ff1_3/ff1.html)

SGFGrove.fileFormat({ FF: 4, GM: 2 }, function (FF) {
    // inherit from FF[4] types
    var Types = Object.create(FF[4].Types);

    // define Othello-specific type
    Types.Point = Types.scalar({
        like: /^[a-h][1-8]$/ // "a1"-"h8"
    });

    // Point becomes Move
    Types.Move = Types.Point;

    this.Types = Types;

    this.properties = function (t) {
        t = t || Types;

        // inherit from FF[4] properties, overriding Point and Move types
        var that = FF[4].properties(t);

        // add Othello-specific properties
        that.merge({
            PE : t.Number,
            OS : t.Number,
            OE : t.Number
        });

        return that;
    };

    return;
});

// SGFGrove knows how to handle Othello game records now
var othello = SGFGrove.parse("(;FF[4]GM[2];B[a1])");
// => [[
//     [{
//         FF: 4,
//         GM: 2
//     }, {
//         B: "a1"
//     }],
//     []
// ]]

// Rejects invalid game records properly
SGFGrove.parse("(;FF[4]GM[2];B[i9])"); // => SyntaxError
```

## Requirements

This module depends on the following methods introduced in ES5:

- `Object.create`
- `Array.isArray`

You can include [es5-shim](https://github.com/es-shims/es5-shim)
to satisfy the requirements (if necessary).

## Limitations

- FF[3] and FF[4] specs do not allow duplicate PropIdents in a Node.
  FF[1]\(=FF[2]) does not refer to the uniqueness. This module follows
  the former specs.

- Only FF[3] allows lowercased letters in a PropIdent.
  This module can not handle them properly when used to specify FF and GM
  properties.

```js
SGFGrove.parse("(;FF[3]CoPyright[foo])"); // supported
SGFGrove.parse("(;FileFormat[3])");       // unsupported
SGFGrove.parse("(;FF[3]GaMetype[2])");    // unsupported
```

## Versioning

If the changes contain an incompatible change that may break the user's
existing code, the module namespace itself will be renamed, e.g.,
`SGFGrove` will become `SGFGrove2`. Otherwise the version number will be
simply incremented.

## History

The data structure of a SGF collection is based on Games::Go::SGF::Grove,
a Perl module on CPAN:

  https://metacpan.org/pod/Games::Go::SGF::Grove

Some modifications were made to the original structure by the author,
and so this module is not compatible with Perl one.

Do not send this module's bug reports/feature requests to the original
module's author but this module's author.

## See Also

- [SGF File Format FF\[4\]](http://www.red-bean.com/sgf/)
- [JSON - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)
- [sgfgrove-gametree](https://github.com/anazawa/sgfgrove-gametree)
- [sgfgrove-ff123](https://github.com/anazawa/sgfgrove-ff123)

## Acknowledgements

Thanks to yewang@github for his thoughtful comments on the data structure of
a game tree.

## Author

Ryo Anazawa (anazawa@cpan.org)

## License

MIT

