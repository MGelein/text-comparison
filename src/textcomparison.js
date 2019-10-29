const { getFilesFromDescriptors, exportSave } = require("./file");
//Saves the results of the comparison for each file
const matches = {};
//the files used in this comparison
const files = [];
//If we keep whitespace in the comparison
var whitespace = false;
//If we should convert to lowercase before comparison
var lowercase = false;
//The size of the ngrams
var ngram = 0;
//The name of the outputfile
var outputFile = "";
//If we should also export the text of a match
var fullText = false;

/**
 * Starts a comparison as described by the passed-on settings object
 * @param {Object} settings the settings object as passed on from the index.js
 */
function doComparison(settings) {
    ngram = settings.ngram;
    lowercase = settings.lowercase;
    whitespace = settings.whitespace;
    outputFile = settings.outputFile;
    fullText = settings.fullText;
    //Request for the files to start loading, this might take a while (async)
    getFilesFromDescriptors(settings.fileDescriptors, setFiles);
}

/**
 * Adds all the items from the provided list
 * into this comparison list of files
 * @param {Array} list 
 */
function setFiles(list) {
    //Remove all old elements
    while (files.length > 0) files.splice(1);
    //Add all the new ones
    for (file of list) {
        if (lowercase) file.contents = file.contents.toLowerCase();
        if (!whitespace) file.contents = file.contents.replace(/\s/g, '');
        files.push(file);
    }
    matches.ids = [];
    matches.passages = [];
    for (file of files) {
        matches.ids.push(file.desc);
    }
    //Now that we have files, create dictionaries
    createDicts();
    //Finally after that do a comparison
    compareAllFiles();
    //Nnow that we have the result, save the file
    exportSave(outputFile, matches);
}

/**
 * Creates the ngram dictionaries that keep track of each ngram and its occurences for each text
 */
function createDicts() {
    //Do this for each file
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        console.log("Creating dictionary " + (file.id + 1) + " of " + files.length + "... " + file.desc);
        file.dict = createDict(file.contents);
        let keys = Object.keys(file.dict);
        let record = { name: "", num: 0 };
        for (key of keys) {
            if (file.dict[key].length > record.num) {
                record.name = key;
                record.num = file.dict[key].length;
            }
        }
        console.log("\tThis text has a total of " + keys.length + " unique ngrams. Most common: " + record.name
            + " (" + record.num + " occurences).");
    }
}

/**
 * Compare all the files to every other file
 */
function compareAllFiles() {
    for (let a = 0; a < files.length; a++) {
        for (let b = a + 1; b < files.length; b++) {
            compareFiles(files[a], files[b]);
        }
    }
}

/**
 * Compares the two given files with eachother
 * @param {File} fileA 
 * @param {File} fileB 
 */
function compareFiles(fileA, fileB) {
    console.log("------------------------------");
    console.log("Starting comparison between " + fileA.desc + " and " + fileB.desc);
    //Find the shared n-grams
    let keysA = Object.keys(fileA.dict);
    let keysB = new Set(Object.keys(fileB.dict));

    let keysShared = Array.from(
        new Set(keysA.filter(key => keysB.has(key)))
    );

    console.log("\tThese files share " + keysShared.length + " ngrams.");
    console.log("Starting expansion of shared ngrams...");
    expandSharedKeys(fileA, fileB, keysShared);
}

/**
 * Expands the keys that are shared between both files
 * @param {File} fileA 
 * @param {File} fileB 
 * @param {Array} keysShared 
 */
function expandSharedKeys(fileA, fileB, keysShared) {
    //For each of the shared keys, find the occruences in both texts
    for (let sharedKey of keysShared) {
        let occsA = fileA.dict[sharedKey];
        let occsB = fileB.dict[sharedKey];
        //Each occurence in text A needs to be compared to each occurence in text B
        for (occA of occsA) {
            for (occB of occsB) {
                expandSharedKey(fileA, fileB, occA, occB);
            }
        }
    }
}

/**
 * Expands a single sharedkey match into a full match
 * @param {File} fileA 
 * @param {File} fileB 
 * @param {Integer} indexA 
 * @param {Integer} indexB 
 */
function expandSharedKey(fileA, fileB, indexA, indexB) {
    const MAX_STRIKES = 5;
    let strikes = MAX_STRIKES;
    let textA = fileA.contents;
    let textB = fileB.contents;
    let matchL = ngram;
    let partA, partB;
    let sim, prevSim = 1;//Previous similarity
    let leftChecked = false;
    //Try expanding as long as the expansion fits in the actual text
    while (indexA > 0 && indexB > 0 && indexA + matchL < textA.length && indexB + matchL < textB.length) {
        //First grab the two parts
        partA = textA.substr(indexA, matchL);
        partB = textB.substr(indexB, matchL);
        sim = getSimilarity(partA, partB);

        //Expand to the correct side
        if (leftChecked) {
            matchL++;
        } else {
            indexA--;
            indexB--;
        }

        //See if the match is improving or not
        if (sim < prevSim) strikes--;
        else if (sim > prevSim && strikes < MAX_STRIKES) strikes++;

        //If the strikes reach 0, either expand to the other side, or just quit now
        if (strikes == 0) {
            if (leftChecked) break;
            else {
                leftChecked = true;
                strikes = MAX_STRIKES;
            }
        }
        //Set the current similarity to be the similarity for the new one
        prevSim = sim;
    }
    registerMatch(fileA, fileB, indexA, indexB, matchL);
}

/**
 * Registers a match that was foudn between these two files
 * @param {File} fileA 
 * @param {File} fileB 
 * @param {Integer} indexA 
 * @param {Integer} indexB 
 * @param {Integer} matchL 
 */
function registerMatch(fileA, fileB, indexA, indexB, matchL) {
    //What is the ID of this comparison
    let compId = fileA.id + "_" + fileB.id;
    //If the array of matches is not there yet, make it
    if (matches[compId] == undefined) matches[compId] = [];
    //Finally register the new match
    let passageA = fileA.id + "@" + indexToMarker(fileA.contents, indexA) + "-" + indexToMarker(fileA.contents, indexA + matchL);
    let passageB = fileB.id + "@" + indexToMarker(fileB.contents, indexB) + "-" + indexToMarker(fileB.contents, indexB + matchL);
    //See if we have an already matching passage
    let isNewMatch = true;
    for (let passage of matches.passages) {
        if (passage[0] === passageA && passage[fullText ? 2 : 1] === passageB) {
            isNewMatch = false;
            break;
        }
    }
    //Only add the new match if it is not a duplicate of what we already have
    if (isNewMatch) {
        if (!fullText) matches.passages.push([passageA, passageB]);
        else {
            matches.passages.push([
                passageA, fileA.contents.substr(indexA, matchL), passageB, fileB.contents.substr(indexB, matchL)
            ]);
        }
    }
}

/**
 * Converts an index from a text into a marker (f.e. a[5], 
 * at the fifth a)
 * @param {String} text 
 * @param {Integer} index 
 */
function indexToMarker(text, index) {
    let char = text.charAt(index);
    let counter = 0;
    let prevText = text.substring(0, index);
    for (let c of prevText) {
        if (c === char) counter++;
    }
    return char + "[" + counter + "]";
}

/**
 * Returns the similarity between two IDENTICAL LENGTH strings
 * as a floating point number, with 0 being completely different
 * and 1 being completely identical.
 * @param {String} stringA 
 * @param {String} stringB 
 */
function getSimilarity(stringA, stringB) {
    let same = 0;
    for (let i = 0; i < stringA.length; i++) {
        if (stringA.charAt(i) === stringB.charAt(i)) same++;
    }
    return same / stringA.length;
}

/**
 * Creates a dictionairy of ngrams from the provided text
 * @param {String} text 
 */
function createDict(text) {
    let dict = {};
    let gram;
    for (let i = 0; i < text.length - ngram; i++) {
        gram = text.substr(i, ngram);
        if (dict[gram] == undefined) {//This means this gram was not yet registered
            dict[gram] = [i];//Add a new array with the first occurence
        } else {
            dict[gram].push(i);//Register this index as another occurence of this gram
        }
    }
    //Return the created dict
    return dict;
}

//Export the compare functionality to the outside world
exports.compare = doComparison;
exports.setFiles = setFiles;