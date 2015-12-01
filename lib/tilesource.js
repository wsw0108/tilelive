var tilesource = exports;
var path = require('path');
var url = require('url');
var qs = require('querystring');

global.tilesourceProtocols = global.tilesourceProtocols || {};

// Add your protocol handlers here.
// 'mbtiles:': require('mbtiles')
tilesource.protocols = global.tilesourceProtocols;

tilesource.defaults = {
    id: null,
    name: '',
    description: '',
    version: '1.0.0',
    legend: null,
    minzoom: 0,
    maxzoom: 22,
    bounds: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
    center: null
};

// List all tile source URIs from all tile sources.
tilesource.list = function(source, callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback required as second argument');
    }

    if (!Object.keys(tilesource.protocols).length) {
        return callback(new Error('No tilesource protocols defined'));
    }

    var result = {};
    var queue = Object.keys(tilesource.protocols);
    var load = function() {
        if (!queue.length) return callback(null, result);
        tilesource.protocols[queue.shift()].list(source, function(err, uris) {
            if (err) return callback(err);
            if (uris) for (var key in uris) {
                if (result[key] == null) result[key] = uris[key];
            }
            load();
        });
    };
    load();
};

// Obtains a tile source URI from an ID, checking all tile source protocols
// until one is found.
tilesource.findID = function(source, id, callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback required as third argument');
    }
    var protocols = Object.keys(tilesource.protocols);
    check();
    function check(/* err, uri */) {
        if (!protocols.length) {
            return callback(new Error('Tileset does not exist'));
        }
        tilesource.protocols[protocols.shift()].findID(source, id, function(err, uri) {
            if (err) check();
            else callback(null, uri);
        });
    }
};

tilesource.load = function(uri, callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback required as second argument');
    }

    if (typeof uri === 'string') {
        uri = url.parse(uri, true);
        uri.pathname = qs.unescape(uri.pathname);
    }

    // Handle uris in the format /path/to/dir?id=bar
    if (!uri.protocol && uri.pathname && uri.query.id) {
        tilesource.findID(uri.pathname, uri.query.id, function(err, uri) {
            if (err) callback(err);
            else tilesource.load(uri, callback);
        });
        return;
    }

    if (!tilesource.protocols[uri.protocol]) {
        return callback(new Error('Invalid tilesource protocol: ' + uri.protocol));
    }

    new tilesource.protocols[uri.protocol](uri, callback);
};

tilesource.auto = function(uri) {
    uri = url.parse(uri, true);
    uri.pathname = qs.unescape(uri.pathname);

    // Attempt to load any modules that may match keyword pattern.
    var keyword = uri.protocol
        ? uri.protocol.replace(':', '').split('+')[0]
        : path.extname(uri.pathname).replace('.', '');
    uri.protocol = uri.protocol || keyword + ':';

    if (!tilesource.protocols[uri.protocol]) {
        [keyword, 'tilesource-' + keyword].forEach(function(name) {
            try {
                var mod = require(name);

                if (typeof mod.registerProtocols === 'function') {
                    mod.registerProtocols(tilesource);
                } else {
                    mod(tilesource);
                }
            } catch(err) {
            }
        });
    }

    return uri;
};

// Load a tilesource and retrieve metadata
tilesource.info = function(uri, callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback required as second argument');
    }

    tilesource.load(uri, function(err, handler) {
        if (err) return callback(err);
        handler.getInfo(function(err, data) {
            if (data) {
                for (var key in tilesource.defaults) {
                    if (data[key] == null) data[key] = tilesource.defaults[key];
                }
                callback(err, data, handler);
            } else {
                callback(err);
            }
        });
    });
};

// Load metadata for all tile source URIs.
// Ignore errors from loading individual models (e.g.
// don't let one bad apple spoil the collection).
tilesource.all = function(source, callback) {
    if (typeof callback !== 'function') {
        throw new Error('Callback required as second argument');
    }

    function first(r) { return r[0]; }
    function second(r) { return r[1]; }
    function sortByName(a, b) {
        return (a[0].name || a[0].id).toLowerCase() <
            (b[0].name || b[0].id).toLowerCase() ? -1 : 1;
    }

    tilesource.list(source, function(err, uris) {
        if (err) return callback(err);
        if (!uris || !Object.keys(uris).length) return callback(null, []);

        var result = [];
        var remaining = Object.keys(uris).length;
        for (var id in uris) {
            tilesource.info(uris[id], function(err, data, handler) {
                if (err) console.error(err.stack);
                if (!err && data && handler) result.push([data, handler]);
                if (!--remaining) {
                    result.sort(sortByName);
                    var models = result.map(first);
                    var handlers = result.map(second);
                    callback(null, models, handlers);
                }
            });
        }
    });
};

tilesource.validate = function(info) {
    function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
    for (var key in info) {
        var val = info[key];
        if (val === null) continue;
        if (val === undefined) continue;
        switch (key) {
        // tilejson spec keys
        case 'scheme':
            if (typeof val !== 'string' || (val !== 'tms' && val !== 'xyz'))
                return new Error('scheme must be "tms" or "xyz"');
            break;
        case 'minzoom':
            if (typeof val !== 'number' || val < 0 || val > 22 || Math.floor(val) !== val)
                return new Error('minzoom must be an integer between 0 and 22');
            break;
        case 'maxzoom':
            if (typeof val !== 'number' || val < 0 || val > 22 || Math.floor(val) !== val)
                return new Error('maxzoom must be an integer between 0 and 22');
            break;
        case 'name':
        case 'version':
            if (typeof val !== 'string' || val.length > 255)
                return new Error(key + ' must be a string of 255 characters or less');
            break;
        case 'attribution':
        case 'description':
            if (typeof val !== 'string' || val.length > 2000)
                return new Error(key + ' must be a string of 2000 characters or less');
            break;
        case 'legend':
        case 'template':
            if (typeof val !== 'string' || val.length > 8000)
                return new Error(key + ' must be a string of 8000 characters or less');
            break;
        case 'tiles':
        case 'grids':
            if (!Array.isArray(val) || val.length <= 0)
                return new Error(key + ' must be an array of templated urls');
            for (var i = 0; i < val.length; i++) if (typeof val[i] !== 'string') {
                return new Error(key + ' must be an array of templated urls');
            }
            break;
        case 'center':
            if (!Array.isArray(val) || val.length !== 3 || !val.every(isNumber))
                return new Error('center must be an array of the form [lon, lat, z]');
            if (val[2] < 0 || val[2] > 22 || Math.floor(val[2]) !== val[2])
                return new Error('center z value must be an integer between 0 and 22');
            break;
        case 'bounds':
            if (!Array.isArray(val) || val.length !== 4 || !val.every(isNumber))
                return new Error('bounds must be an array of the form [west, south, east, north]');
            if (val[0] > val[2])
                return new Error('bounds west value must be less than or equal to east');
            if (val[1] > val[3])
                return new Error('bounds south value must be less than or equal to north');
            break;
        // additional keys around the tilejson/tilesource ecosystem
        case 'format':
            if (typeof val !== 'string' || val.length > 255)
                return new Error(key + ' must be a string of 255 characters or less');
            break;
        case 'source':
            if (typeof val !== 'string' || val.length > 2000)
                return new Error(key + ' must be a string of 2000 characters or less');
            break;
        case 'vector_layers':
            if (!Array.isArray(val) || val.length === 0)
                return new Error('vector_layers must be an array of layer objects');
            for (i = 0; i < val.length; i++) {
                var lkey = 'vector_layers[' + i + ']';
                if (typeof val[i] !== 'object')
                    return new Error(lkey + ' must be a layer object');
                if (typeof val[i].id !== 'string' || val[i].id.length > 255)
                    return new Error(lkey + ' id must be a string of 255 characters or less');
            }
            break;
        }
    }

    // cross-key checks. these do not *require* keys -- only check certain
    // constraints if multiple keys are present.
    if ((typeof info.minzoom === 'number') && (typeof info.maxzoom === 'number') && info.minzoom > info.maxzoom)
        return new Error('minzoom must be less than or equal to maxzoom');

    if (Array.isArray(info.center) && Array.isArray(info.bounds)) {
        if (info.center[0] < info.bounds[0] || info.center[0] > info.bounds[2])
            return new Error('center lon value must be between bounds ' + info.bounds[0] + ' and ' + info.bounds[2]);
        if (info.center[1] < info.bounds[1] || info.center[1] > info.bounds[3])
            return new Error('center lat value must be between bounds ' + info.bounds[1] + ' and ' + info.bounds[3]);
    }

    if (Array.isArray(info.center) && (typeof info.minzoom === 'number') && info.center[2] < info.minzoom)
        return new Error('center zoom value must be greater than or equal to minzoom ' + info.minzoom);
    if (Array.isArray(info.center) && (typeof info.maxzoom === 'number') && info.center[2] > info.maxzoom)
        return new Error('center zoom value must be less than or equal to maxzoom ' + info.maxzoom);
};

tilesource.verify = function(ts, required) {
    // Let validate catch any invalid values.
    var err = tilesource.validate(ts);
    if (err) return err;

    // Verify is stricter, requiring certain keys.
    required = required || ['minzoom', 'maxzoom', 'bounds', 'center'];
    for (var i = 0; i < required.length; i++) {
        if (!(required[i] in ts)) {
            return new Error(required[i] + ' is required');
        }
    }
};
