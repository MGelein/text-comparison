const {getFilesFromDescriptors} = require("./file");

/**
 * Starts a comparison as described by the passed-on settings object
 * @param {Object} settings the settings object as passed on from the index.js
 */
function doComparison(settings){
    let files = getFilesFromDescriptors(settings.fileDescriptors);
}

//Export the compare functionality to the outside world
exports.compare = doComparison;