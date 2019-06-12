const {getFilesFromDescriptors} = require("./file");
const chalk  = require('chalk');
//the files used in this comparison
var files = [];

/**
 * Starts a comparison as described by the passed-on settings object
 * @param {Object} settings the settings object as passed on from the index.js
 */
function doComparison(settings){
    getFilesFromDescriptors(settings.fileDescriptors, setFiles);
}

/**
 * Adds all the items from the provided list
 * into this comparison list of files
 * @param {Array} list 
 */
function setFiles(list){
    files = [];
    for(file of list){
        files.push(file);
    }
}

//Export the compare functionality to the outside world
exports.compare = doComparison;
exports.setFiles = setFiles;