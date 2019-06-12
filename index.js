//We need the actual textcomparison library for its own compare function
const {compare} = require('./src/textcomparison');
//Contains the default settings that can be modified
const settings = {};
//the chalk module allows coloring of output
const chalk = require('chalk');
//Default to 6 size of ngram characters
settings.ngram = 6;
//Default output file name
settings.outputFile = "./output.tsv";
//List of filenames or urls that we want to compare
settings.fileDescriptors = [];

//Contains all the command line arguments that are relevant for us, so anything after the command name
const args = process.argv.splice(2);

//If there are not enough arguments, display help
if(args.length < 1) displayHelp();
else parseArgs(args);

//After we have parsed the arguments, now start the actual comparison process, if all prerequisites are met
if(settings.fileDescriptors.length > 1){
    //If we have enough files, start the comparison
    compare(settings);
}else{
    console.log(chalk.red("Aborting: At least two filedescriptors must be given for a comparison to be made..."));
}


/**
 * Parses the array of command line arguments
 */
function parseArgs(args){
    for(let i = 0; i < args.length; i++){
        let arg = args[i];
        arg = arg.trim().toLowerCase();

        if(arg === '-h' || arg === '--help' || arg === '?') {
            displayHelp();
        }else if(arg === '-n' || arg === '--ngram'){
            //See if it is a valid location and a number
            if(i + 1 < args.length && !isNaN(args[i + 1])){
                //If so overwrite the n-gram setting
                settings.ngram = args[i + 1];
                i++//Skip the next one
            }
        }else if(arg === '-o' || arg === '--output'){
            //See if this is a valid index
            if(i + 1 < args.length){
                settings.outputFile = args[i + 1];
                i++;//Skip the next one
            }
        }else{
            //If it is an unrecognized argument, assume it's a file
            settings.fileDescriptors.push(arg);
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
    //Always exit after displaying help
    process.exit();
}