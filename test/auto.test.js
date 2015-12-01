var test = require('tape');
var assert = require('assert');
var tilesource = require('../');
var orig = tilesource.protocols;

test('fails to load .mbtiles', function(t) {
    tilesource.protocols = {};
    tilesource.load('mbtiles://' + __dirname + '/fixtures/plain_1.mbtiles', function(err, source) {
        t.ok(err);
        t.equal('Invalid tilesource protocol: mbtiles:', err.message);
        t.end();
    });
});
test('auto extname .mbtiles', function(t) {
    tilesource.protocols = {};
    var uri = tilesource.auto(__dirname + '/fixtures/plain_1.mbtiles');
    t.equal('mbtiles:', uri.protocol);
    tilesource.load(uri, function(err, source) {
        t.ifError(err);
        t.ok(source);
        t.end();
    });
});
test('auto protocol mbtiles://', function(t) {
    tilesource.protocols = {};
    var uri = tilesource.auto(__dirname + '/fixtures/plain_1.mbtiles');
    t.equal('mbtiles:', uri.protocol);
    tilesource.load(uri, function(err, source) {
        t.ifError(err);
        t.ok(source);
        t.end();
    });
});
test('auto extname .tilejson', function(t) {
    tilesource.protocols = {};
    var uri = tilesource.auto(__dirname + '/fixtures/mapquest.tilejson');
    t.equal('tilejson:', uri.protocol);
    tilesource.load(tilesource.auto(__dirname + '/fixtures/mapquest.tilejson'), function(err, source) {
        t.ifError(err);
        t.ok(source);
        t.end();
    });
});
test('auto protocol tilejson://', function(t) {
    tilesource.protocols = {};
    var uri = tilesource.auto('tilejson://' + __dirname + '/fixtures/mapquest.tilejson');
    t.equal('tilejson:', uri.protocol);
    tilesource.load(uri, function(err, source) {
        t.ifError(err);
        t.ok(source);
        t.end();
    });
});
test('auto protocol tilejson+http://', function(t) {
    tilesource.protocols = {};
    var uri = tilesource.auto('tilejson+http://tile.stamen.com/toner/index.json');
    t.equal('tilejson+http:', uri.protocol);
    tilesource.load(uri, function(err, source) {
        t.ifError(err);
        t.ok(source);
        t.end();
    });
});
test('auto should parse qs ', function(t) {
    tilesource.protocols = {};
    var uri = tilesource.auto('http://tile.stamen.com/toner/{z}/{x}/{y}.png?foo=bar');
    t.equal('http:', uri.protocol);
    t.equal('bar', uri.query.foo);
    t.end();
});
test('cleanup', function(t) {
    tilesource.protocols = orig;
    t.end();
});
