var test = require('tape');

test('protocols', function(t) {
    var tilesourceA = require('../');
    tilesourceA.protocols['foobar:'] = function() {};

    // Clear the require cache.
    for (var key in require.cache) delete require.cache[key];

    var tilesourceB = require('../');
    t.ok(tilesourceA !== tilesourceB, 'separate tilesource instances');
    t.ok(tilesourceA.protocols === tilesourceB.protocols, 'protocols are identical');
    t.ok(tilesourceA.protocols['foobar:'], 'foobar: registered with tilesource A');
    t.ok(tilesourceB.protocols['foobar:'], 'foobar: registered with tilesource B');

    t.end();
});
