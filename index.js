//We need the actual textcomparison library for its own compare function
const {compare} = require('./src/textcomparison');
//Default to 6 size of ngram characters
let ngram = 6;
//Default output file name
let outputFile = "./output.tsv";

//Contains all the command line arguments that are relevant for us, so anything after the command name
const args = process.argv.splice(2);

//If there are not enough arguments, display help
if(args.length < 1) displayHelp();
else parseArgs(args);


/**
 * Parses the array of command line arguments
 */
function parseArgs(args){
    for(let arg of args){
        arg = arg.trim().toLowerCase();

        if(arg === '-h' || arg === '--help' || arg === '?') {
            displayHelp();
            return;//Don't do anything else displaying help
        }
        
    }
}

/**
 * Displays the help text of this module. It briefly explains how to use the module
 */
function displayHelp(){
    let output = `Text Comparison, Made by Mees Gelein, licensed under MIT (2019).

The following parameters are supported by this comparison utility:
--ngram or -n   sets the ngram size. Default 6. This is in CHARACTERS!
--output or -o  sets the name of the output file
--help or -h    display this menu
    `
    console.log(output);
}