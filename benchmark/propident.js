var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

var values = [
    "C[foo]",
    "C[foo\\]bar]",
    "C[foo\\]bar\\]baz]",
    "C[foo\\\\]",
];

suite.
add('normal', function () {
    for (var i = 0; i < values.length; i++) {
        /\[((?:\\.|[^\]\\]+)*)\]/.exec(values[i]);
    }
}).
add('unrolling the loop', function () {
    for (var i = 0; i < values.length; i++) {
        /\[([^\]\\]*(?:\\.[^\]\\]*)*)\]/.exec(values[i]);
    }
}).
on('cycle', function (event) {
    console.log( String(event.target) );
}).
on('complete', function (event) {
    console.log( 'Fastest is '+this.filter('fastest').map('name') );
}).
run();

