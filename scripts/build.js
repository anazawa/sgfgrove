var pkg = require("../package.json");
var fs = require("fs");
var now = new Date();

var header = [
    "/**\n",
    " * @license "+pkg.name+" "+pkg.version+"\n",
    " * (c) 2015-"+now.getFullYear()+" "+pkg.author.name+" "+pkg.homepage+"\n",
    " * Licence: "+pkg.license+"\n",
    " */\n"
].join("");

var body = fs.readFileSync("./lib/sgfgrove.js", "utf8");

fs.mkdirSync("./dist");
fs.writeFileSync("./dist/sgfgrove.js", header+body);

