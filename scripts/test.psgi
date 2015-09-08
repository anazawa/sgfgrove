use strict;
use warnings;
use Plack::Builder;
use Plack::Response;

my $static = {};

my $app = builder {
    mount '/' => sub {
        my $res = Plack::Response->new(200);
        $res->content_type('text/html');
        $res->body($static->{'index.html'});
        $res->finalize;
    };
    mount '/index.css' => sub {
        my $res = Plack::Response->new(200);
        $res->content_type('text/css');
        $res->body($static->{'index.css'});
        $res->finalize;
    };
    mount '/index.js' => sub {
        my $res = Plack::Response->new(200);
        $res->content_type('text/javascript');
        $res->body($static->{'index.js'});
        $res->finalize;
    };
    mount '/test.js' => sub {
        my $res = Plack::Response->new(200);
        $res->content_type('text/javascript');
        $res->body(`browserify ./test/*.js ./test/*/*.js`);
        $res->finalize;
    };
};

$static->{'index.css'} = <<'CSS';
body { padding: 1em }
.success { color: green; }
.fail { color: red; }
CSS

$static->{'index.js'} = <<'JS';
(function () {
    "use strict";

    if (typeof console === "undefined") {
        console = {};
    }

    console.log = function (msg) {
        var testLine = /^(ok|not ok)/.exec(msg);
        var pre = document.getElementById("console");
        var text = document.createTextNode(msg);
        var lf = document.createTextNode("\n");

        if (testLine) {
            var span = document.createElement("span");
            span.className = testLine[1] === "ok" ? "success" : "fail";
            span.appendChild(text);
            pre.appendChild(span);
        }
        else {
            pre.appendChild(text);
        }

        pre.appendChild(lf);

        return;
    };
}());
JS
 
$static->{'index.html'} = <<'HTML';
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="index.css">
    <script src="index.js"></script>
    <script src="test.js"></script>
  </head>
  <body>
    <pre id="console"></pre>
  </body>
</html>
HTML

$app;

