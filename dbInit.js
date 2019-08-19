/*
	Author: Tresor Cyubahiro
	Date: 08.15.2019
	Description:A script to read and initialize a mongoDB collection of all cities in the US
*/

const fs = require('fs');
const readline = require('readline');
const dbHelper = require('./dbHelper');
const dbName = 'USCities';

const readInterface = readline.createInterface({
    input: fs.createReadStream('./US.txt'),
    output: process.stdout,
    console: false,
    terminal: false
});

var processedLines = 0;

readInterface.on('line', async function(line) {
	if (processedLines ===0) {
		console.log("\n\nReading  data file...This may take a while.");
		processedLines++;
	}
    await parseLine(line);
}).on('close', function() {
	console.log("\n\n===================\n\nDone...\n\n===================\n\n");
	addIndexes();
});

/**
	Function to add a new record to the usCities collection
	@param {string} line
*/
async function parseLine (line) {
	let parsed = line.split('\t');
	if(parsed.length !== 18) {
		let name = parsed[1],
			asciiname = parsed[2],
			alternateNames = parsed[3],
			latitude = parseFloat(parsed[4]),
			longitude = parseFloat(parsed[5]),
			countryCode = parsed[8],
			timeZone = parsed[17];
			let placeRecord = {
				'name': name,
				'asciiname': asciiname,
				'alternateNames': alternateNames,
				'countryCode': countryCode,
				'timeZone': timeZone,
				'location': {
					'type': "Point",
					'coordinates': [longitude, latitude]
				}
			};
			
			try {	
				await addRecord(placeRecord);
			} catch(err) {
				console.error(err.message);
			}

	} else {
		throw new Error("Invalid record found");
	}
}

/**
	Function that invokes add a new record to the usCities collection
	@param {object} placeRecord
	@returns {boolean} a value indicating success (true) or failure (false)
*/
async function addRecord(placeRecord) {
	var dbRecord = await dbHelper.addUSRecord(placeRecord);
	if (dbRecord === null) {
		return false;
	}
	return true;
}

/**
	Function to add indexes to collection
*/
async function addIndexes() {
	console.log("\n\nAdd indexes for querying...");
	var status = await dbHelper.createIndexes();
	if (status === null) {
		console.log("\n\nError adding indexes for...");
	}
	console.log("\n\nIndexes added...\n\n");
	endProcess();
}

/**
	Function to end program
*/
function endProcess() {
	process.exit(1);
}