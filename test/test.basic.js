/* global require */
(function () {
    "use strict";

    var test = require('tape');
    var SGF = require('../lib/sgfgrove.js');

    test('basic', function (t) {
        var text
            = '(;FF[4]C[root]' +
                  '(;C[a];C[b]' +
                      '(;C[c])' +
                      '(;C[d];C[e]))' +
              '(;C[f]' +
                  '(;C[g];C[h];C[i])' +
                  '(;C[j])))';

        var sgf = [[
            [{ FF: 4, C: 'root' }],
            [[
                [{ C: 'a' }, { C: 'b' }],
                [
                    [[{ C: 'c' }], []],
                    [[{ C: 'd' }, { C: 'e' }], []],
                ]
            ], [
                [{ C: 'f' }],
                [
                    [[{ C: 'g' }, { C: 'h' }, { C: 'i' }], []],
                    [[{ C: 'j' }], []]
                ]
            ]]
        ]];

        t.deepEqual( SGF.parse(text), sgf, 'SGF.parse' );
        t.equal( SGF.stringify(sgf), text, 'SGF.stringify' );

        t.deepEqual(
            SGF.parse('(;FF[4])', function (k, v) {
                return /^[A-Z]/.test(k) ? k+'['+v+']' : v;
            }),
            [[
                [{ FF: 'FF[4]' }],
                []
            ]],
            'SGF.parse: reviver should be called'
        );

        /*
        t.throws(
            function () {
                SGF.parse('(;FF[5])');
            },
            Error,
            'SGF.parse: unsupported'
        );
        */

        t.end();
    });

}());
