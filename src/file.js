const http = require('http');
const https = require('https');
const fs = require('fs');
const chalk = require('chalk');

//Array of all the file objects that we have in memory
const files = [];
const pending = [];
var fileCallback;

/**
 * Returns the files that were parsed from the descriptions
 * @param {Array} descriptors 
 * @returns an array containing all file-data in one single object per file
 */
function getFilesFromDescriptors(descriptors, callback) {
    //Set the ref to the file callback
    fileCallback = callback;
    //First add all defs to the pending list
    for (fileDef of descriptors) pending.push(fileDef);
    //Then actually try to get the data from them
    for (fileDef of descriptors) {
        getFileFromDescriptor(fileDef);
    }
}

/**
 * Returns the file that can be parsed from this descriptor
 * @param {String} desc 
 */
function getFileFromDescriptor(desc) {
    //Do some minor trimming and stuff on the input desc
    desc = desc.trim().toLowerCase();
    //Setup the variable that will be stored later on
    //See if it is an http(s) link
    if (desc.indexOf('http') > -1) {
        let secure = desc.indexOf('https') > -1;
        let module = secure ? https : http;
        module.get(desc, response => {
            //If we have a non-200 statuscode
            if (response.statusCode < 200 || response.statusCode > 299) {
                pending.splice(pending.indexOf(desc), 1);
                console.log(chalk.red("Received status code: [" + response.statusCode + "] Could not open url: " + desc));
                //Abort this one
                return;
            }
            console.log("Requesting remote data from: " + desc);
            let rawData = "";
            //If we receive more data, add it to the rawData var
            response.on('data', (chunk) => rawData += chunk);
            //If this is the end of the transmission, actually read this data
            response.on('end', () => {
                createFileObject(desc, rawData.toString());
            });
        });
    } else {
        //Assume it's a local file link
        if (fs.existsSync(desc)) {
            console.log("Reading local data from: " + desc);
            let data = fs.readFileSync(desc, 'utf-8');
            createFileObject(desc, data);
        } else {
            //Remove this index, since it's not a real file
            pending.splice(pending.indexOf(desc), 1);
            console.log(chalk.red("Could not open file: " + desc));
        }
    }
}

/**
 * Creates a new fileobject and appends it to the list of files
 * @param {String} description 
 * @param {String} textContents 
 */
function createFileObject(description, textContents) {
    files.push({
        desc: description,
        contents: textContents,
        id: files.length
    });
    let index = pending.indexOf(description);
    pending.splice(index, 1);
    console.log("Parsed file: (" + (files[files.length - 1]).id + ") => " + description);
    //See if this was the last pending file
    if (pending.length == 0) {
        if (files.length > 1) {
            fileCallback(files);
        } else {
            console.log(chalk.red("Aborting: Too few valid files. You should at least provide 2 valid files for comparison!"));
            process.exit();
        }
    }
}

//Export the right functionality
exports.getFilesFromDescriptors = getFilesFromDescriptors;