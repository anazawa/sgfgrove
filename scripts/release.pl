#!/usr/bin/env perl
use strict;
use warnings;
use Fatal qw(open close rename);
use File::stat;

my $version = shift or die "<version> is required";

my %filters = (
    './package.json' => sub {
        s/("version"\s*:\s*)"[^"]*"/$1"$version"/; # "version": "1.2.3"
    },
    './sgfgrove.js' => sub {
           s/(\@version\s+).*/$1$version/           # @version 1.2.3
        || s/(VERSION\s*:\s*)"[^"]*"/$1"$version"/; # VERSION: "1.2.3"
    },
);

# https://metacpan.org/pod/ShipIt::Step::ChangeAllVersions
while ( my ($file, $filter) = each %filters ) {
    my $mode = stat($file)->mode;

    open my $in, '<', $file;
    open my $out, '>', "$file.tmp";

    while ( <$in> ) {
        $filter->();
        print $out $_;
    }

    close $in;
    close $out;

    rename $file => "$file~";
    rename "$file.tmp" => $file;
    chmod $mode, $file;

    unlink "$file~";
}

system 'git', 'commit', '-m', "version $version";
system 'git', 'tag', '-a', "v$version", '-m', "version $version";

