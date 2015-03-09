var test = require('tape');
var SGF = require('../sgf.js');

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
      { C: 'a' }, { C: 'b' },
      [
        [{ C: 'c' }, []],
        [{ C: 'd' }, { C: 'e' }, []],
      ]
    ], [
      [{ C: 'f' }],
      [
        [{ C: 'g' }, { C: 'h' }, { C: 'i' }, []],
        [{ C: 'j' }, []]
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

  t.equal(
    SGF.stringify([[
      [{
        FF: 4,
        FOO: {
          bar: 'baz',
          toSGF: function () {
            return [this.bar];
          }
        }
      }],
      []
    ]]),
    '(;FF[4]FOO[baz])',
    'SGF.stringify: toSGF method should be invoked'
  );

  t.throws(
    function () {
      SGF.parse('(;FF[5])');
    },
    Error,
    'SGF.parse: unsupported'
  );

  t.end();
});

