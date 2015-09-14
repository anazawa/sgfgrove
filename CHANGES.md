Revision history for SGFGrove.js.

## 1.0.2 Sep 14th, 2015

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

