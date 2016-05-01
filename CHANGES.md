Revision history for SGFGrove.js.

## 1.0.7

- remove gametree.js and ff123.js from this repository

## 1.0.6

- requires ES5 or higher
- remove "Other SGF Parsers" from README (it's not up to date anymore)
- remove sgfgrove/collection.js
- sgfgrove/ff123.js and gametree.js will be removed from this repository
  in 1.0.6. They will be provided by their own repositories.

## 1.0.5

- add sgfgrove/gametree.js and gametree.md
- add tests for sgfgrove/gametree.js
- sgfgrove/collection.js is obsolete, will be remove in 1.0.6.
  Use gametree.js instead.

## 1.0.4

- fix PropIdent regular expression bug (thanks to @yewang)
- fix compose type regular expression bug
- add more tests for compose type

## 1.0.3

- add "SGF File Format Detection" to README
- add #fileFormat
- #define is obsolete and will be removed in 1.0.4. Use #fileFormat intead
- allow lower-case letters in PropIdents only in FF[3] files
- add tests for FF[4] Number
- add tests for SGFGrove.Util
- add tests for FF[4] properties

## 1.0.2

- add a table of contents to README.md
- add "SGF Property Types" to README.md
- add "Limitations" to README.md
- add scripts/test.psgi
- add sgfgrove/validator.js
- add test/test.stringify.js
- #stringify does not throw an exception anymore
  but simply ignores properties that have invalid values

## 1.0.1

- add examples/
- add scripts/
- fix FF[3] LB property bug (LB was not list but scalar)
- rename test/test.syntax.js to test.parse.js
- add tests for #parse

## 1.0.0

- first production release
- tabstop 2 => 4
- no code changes

## 0.0.2 (beta)

- add .jshintrc
- add .travis.yml
- remove jsdoc.conf
- add "argg" and "jshist" to package.json as "devDependencies"
- SGFGrove.stringify's replacer callback is applied to the given data
  recursively
- (regexp) use [\s\S] instead of .
- fix FF[4] Compose type bug (the right value was invalid)
- add sgfgrove/collection.js that is an iterator/manimulator for SGF colleciton
- add tests for SGFGrove.collection
- lint everything to satisfy jshint

### README

- add Travis CI status image
- add more links to SEE ALSO
- update examples

## 0.0.1 (beta)

- initial version

