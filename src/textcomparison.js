const {getFilesFromDescriptors} = require("./file");
const chalk  = require('chalk');
//the files used in this comparison
const files = [];
//If we keep whitespace in the comparison
var whitespace = false;
//If we should convert to lowercase before comparison
var lowercase = false;
//The size of the ngrams
var ngram = 0;

/**
 * Starts a comparison as described by the passed-on settings object
 * @param {Object} settings the settings object as passed on from the index.js
 */
function doComparison(settings){
    ngram = settings.ngram;
    lowercase = settings.lowercase;
    whitespace = settings.whitespace;
    //Request for the files to start loading, this might take a while (async)
    getFilesFromDescriptors(settings.fileDescriptors, setFiles);
}

/**
 * Adds all the items from the provided list
 * into this comparison list of files
 * @param {Array} list 
 */
function setFiles(list){
    //Remove all old elements
    while(files.length > 0) files.splice(1);
    //Add all the new ones
    for(file of list){
        if(lowercase) file.contents = file.contents.toLowerCase();
        if(!whitespace) file.contents = file.contents.replace(/\s/g, '');
        files.push(file);
    }
    //Now that we have files, create dictionaries
    createDicts();
}

/**
 * Creates the ngram dictionaries that keep track of each ngram and its occurences for each text
 */
function createDicts(){
    //Do this for each file
    for(file of files){
        console.log("Creating dictionary " + (file.id + 1) + " of " + files.length + "... " + file.desc);
        file.dict = createDict(file.contents);
        let keys = Object.keys(file.dict);
        let record = {name: "", num: 0};
        for(key of keys){
            if(file.dict[key].length > record.num){
                record.name = key;
                record.num = file.dict[key].length;
            }
        }
        console.log("\tThis text has a total of " + keys.length + " unique ngrams. Most common: " + record.name
        + " (" + record.num + " occurences).");
    }
}

/**
 * Creates a dictionairy of ngrams from the provided text
 * @param {String} text 
 */
function createDict(text){
    let dict = {};
    let gram;
    for(let i = 0; i < text.length - ngram; i++){
        gram = text.substr(i, ngram);
        if(dict[gram] == undefined){//This means this gram was not yet registered
            dict[gram] = [i];//Add a new array with the first occurence
        }else{
            dict[gram].push(i);//Register this index as another occurence of this gram
        }
    }
    //Return the created dict
    return dict;
}

//Export the compare functionality to the outside world
exports.compare = doComparison;
exports.setFiles = setFiles;