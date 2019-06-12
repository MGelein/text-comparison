const http = require('http');
const https = require('https');
const fs = require('fs');


//Array of all the file objects that we have in memory
const files = [];

/**
 * Returns the files that were parsed from the descriptions
 * @param {Array} descriptors 
 * @returns an array containing all file-data in one single object per file
 */
function getFilesFromDescriptors(descriptors){
    for(fileDef of descriptors){
        getFileFromDescriptor(fileDef);
    }
    //Return the parsed files
    return files;
}

/**
 * Returns the file that can be parsed from this descriptor
 * @param {String} desc 
 */
function getFileFromDescriptor(desc){
    //Do some minor trimming and stuff on the input desc
    desc = desc.trim().toLowerCase();
    //Setup the variable that will be stored later on
    //See if it is an http(s) link
    if(desc.indexOf('http') > -1){
        let secure = desc.indexOf('https') > -1;
        let module = secure ? https : http;
        module.get(desc, response =>{
            console.log("Requesting remote data from: " + desc);
            let rawData = "";
            //If we receive more data, add it to the rawData var
            response.on('data', (chunk) => rawData += chunk);
            //If this is the end of the transmission, actually read this data
            response.on('end',  () => {
                createFileObject(desc, rawData.toString());
            });
        });
    }else{
        //Assume it's a local file link
        if(fs.existsSync(desc)){
            console.log("Reading local data from: " + desc);
            let data = fs.readFileSync(desc, 'utf-8');
            createFileObject(desc, data);
        }
    }
}

/**
 * Creates a new fileobject and appends it to the list of files
 * @param {String} description 
 * @param {String} textContents 
 */
function createFileObject(description, textContents){
    files.push({
        desc: description,
        contents: textContents,
        id: files.length
    });
    console.log("Parsed file: (" + (files[files.length - 1]).id + ") => " + description);
}

//Export the right functionality
exports.getFilesFromDescriptors = getFilesFromDescriptors;