```javascript
function Tilesource(options, callback) {
    // call callback when done.
}
```

```javascript
// z, res, xmin, ymin
Tilesource.prototype.getTile = function(z, res, xmin, ymin, callback) {
    // when initialization is incomplete, this will fail always.

    // obtains tile and calls callback:
    function(err, tile, options) {
        // err is set when the tile does not exist or when retrieval failed.
        // If the tile does not exist and that's OK, the error message should
        // explicitly read 'Tile does not exist'.
        // otherwise, tile is a buffer containing the compressed image data
    }
};
```

```javascript
// z, res, xmin, ymin
Tilesource.prototype.getGrid = function(z, res, xmin, ymin, callback) {
    // when initialization is incomplete, this will fail always.

    // obtains tile and calls callback:
    function(err, tile, options) {
        // err is set when the tile does not exist or when retrieval failed.
        // otherwise, tile is a buffer containing the compressed image data
    }
};
```

```javascript
Tilesource.prototype.getInfo = function(callback) {
    // when initialization is incomplete, this will fail always.

    // obtains tile and calls callback:
    function(err, data) {
        // err is set when information retrieval failed.
        // otherwise, data is a hash containing all the information.
    }
};
```
