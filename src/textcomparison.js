/**
 * Starts a comparison as described by the passed-on settings object
 * @param {Object} settings the settings object as passed on from the index.js
 */
function doComparison(settings){
    console.log(settings);
}


//Export the compare functionality to the outside world
exports.compare = doComparison;