/*
	Author: Cyubahiro Tresor
	Date: 08.15.2019
	Description: REST API endpoint that provides auto-complete suggestions for places in large cities. Using records for US Cities as provided by Geonames.org.
*/

const dbMid = require('./dbHelper');

/**
	Function that invokes dbHelper's searchForPlaces
	@param {string} searchText
	@param {number} maxNumOfResults
	@param {number} paginationCount
	@returns {object} found places in property .found
*/
exports.searchForPlaces = async function (searchText, maxNumOfResults, paginationCount) {
	var records = await dbMid.searchPlaces(searchText, maxNumOfResults, paginationCount);
	if (records === null) {
		return ({success: false, found: {}});
	}
	var adjustedRecords = await adjustTextScores(records);
	return ({success: true, found: adjustedRecords});
}

/**
	Function that invokes dbHelper's searchForPlaces and ranks found places by distance from provided location
	@param {string} searchText
	@param {number} searchLatitude
	@param {number} searchLongitude
	@param {number} maxNumOfResults
	@param {number} paginationCount
	@returns {object} found places in property .found
*/
searchPlacesNearLocation = async function(searchText, searchLatitude, searchLongitude, maxNumOfResults,paginationCount) {

	let records = await dbMid.searchPlaces(searchText, maxNumOfResults, paginationCount);
	if (records === null) {
		return ({success: false, found: {}});
	}
	let adjustedTextRecords = await adjustTextScores(records);
	let positionTaggedRecords = await getDistances(adjustedTextRecords, searchLatitude, searchLongitude);
	let maxDistance = await getMaxDistance(positionTaggedRecords);
	let distanceTaggedRecords = await adjustPositionScores(positionTaggedRecords, maxDistance);
	distanceTaggedRecords.sort((a,b) => { return b.positionScore - a.positionScore});
	return ({success: true, found: distanceTaggedRecords});
}

/**
	Function that invokes searchPlacesNearLocation and filters them by a maximum distance
	@param {string} searchText
	@param {number} searchLatitude
	@param {number} searchLongitude
	@param {number} maxDistance
	@param {number} maxNumOfResults
	@param {number} paginationCount
	@returns {object} found places in property .found
*/
exports.searchPlacesNearLocationWithMaxDistance = async function(searchText, searchLatitude, searchLongitude, maxDistance, maxNumOfResults, paginationCount) {
	let distanceTaggedRecords = await searchPlacesNearLocation(searchText, searchLatitude, searchLongitude, maxNumOfResults, paginationCount);
	let filtered = distanceTaggedRecords.found.filter(place => { return place.distanceFromUser <= maxDistance });
	return ({success: true, found: filtered });
}


/**
	Function that removes MongoDD's bonuses for raw term matches and narrow the scores to range of 0 to 1
	@param {object} places
	@returns {object} found places with adjusted text match scores
*/
function adjustTextScores(places) {
	for (let i = 0; i < places.length; i++) {
		places[i].score = places[i].score > 1.0? 1 : places[i].score.toFixed(1);
	}
	return places;
}


/**
	Function that tags and filters them by a maximum distance
	@param {string} searchText
	@param {number} searchLatitude
	@returns {object} found places tagged with position scores
*/
function adjustPositionScores(places, maxDistance) {
	for (let i = 0; i < places.length; i++) {
		places[i].positionScore = getDistanceScore(places[i].distanceFromUser, maxDistance);
	}
	return places;
}

/**
	Function that tags found places with distances to given location
	@param {object} places
	@param {number} searchLatitude
	@param {number} searchLongitude
	@returns {object} found places tagged with distances
*/
async function getDistances(places, searchLatitude, searchLongitude) {
	for (let i = 0; i < places.length; i++) {
		places[i].distanceFromUser = await getDistanceToPosition(searchLatitude, searchLongitude, places[i].location.coordinates[1], places[i].location.coordinates[0]);
	}
	return places;
}

/**
	Function that calculates distance between two geographical points. Formula as seen on https://www.movable-type.co.uk/scripts/latlong.html
	@param {number} searchLatitude
	@param {number} searchLongitude
	@param {number} placeLatitude
	@param {number} placeLongitude
	@returns {number} distance (meters)
*/
function getDistanceToPosition(searchLatitude, searchLongitude, placeLatitude, placeLongitude) {
	    let R = 6371000.0; // IN METERS
	    let distance = 0.0;
	    let bearing = 0.0;

	    let lat1Rad = toRadians(searchLatitude);
	    let lat2Rad = toRadians(placeLatitude);
	    let changePhi = toRadians(placeLatitude - searchLatitude);
	    let changeLambda = toRadians(placeLongitude - searchLongitude);

	    let a = (Math.sin(changePhi/2) * Math.sin(changePhi/2)) + (Math.cos(lat1Rad) * Math.cos(lat2Rad)) * (Math.sin(changeLambda/2) * Math.sin(changeLambda/2));
	    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	    distance = R * c;
	    return Math.round(distance);
	}

/**
	Function that calculates a score for place's distance from given location, relative to other places found
	@param {number} distance
	@param {number} maxDistance
	@returns {number} distance Score
*/
function getDistanceScore (distance, maxDistance) {
	if (distance === 0) {
		return 1;
	}

	let relativeScore = (distance / maxDistance);
	return 1 - relativeScore;
}

/**
	Function that finds maximum distance from an array of distances
	@param {object} places
	@returns {number} maximum distance
*/
function getMaxDistance (places) {
	let allDistances = places.map(place => place.distanceFromUser);
	allDistances.sort((a, b) => {return a - b });
	return allDistances[allDistances.length - 1];
}

/**
	Function that converts degrees to radians
	@param {number} degrees
	@returns {number} radians
*/
function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}

/**
	Function that filters fields to send to users
	@param {object} places
	@returns {object} places with filtered properties
*/
function prettify (places) {
	let prettified = [places.length];
	for (var i = 0; i < places.length; i++) {
		prettified[i]  = {
			"name": places[i].name,
			"countryCode": places[i].countryCode,
			"timeZone": places[i].timeZone,
			"searchTextScore": parseFloat(places[i].score),
			"latitude": places[i].location.coordinates[1],
			"longitude": places[i].location.coordinates[0]
		}
	}
	return prettified;
}

/**
	Function that filters fields to send to users, including distance and position score
	@param {object} places
	@returns {object} places with filtered properties
*/
function prettifyWithPosition (places) {
	let prettified = [places.length];
	for (var i = 0; i < places.length; i++) {
		prettified[i]  = {
			"name": places[i].name,
			"countryCode": places[i].countryCode,
			"timeZone": places[i].timeZone,
			"searchTextScore": parseFloat(places[i].score),
			"latitude": places[i].location.coordinates[1],
			"longitude": places[i].location.coordinates[0],
			"positionScore": places[i].positionScore,
			"distanceFromUser": places[i].distanceFromUser,
		}
	}
	return prettified;
}


// ============ Exports for usage and tests =============

exports.searchPlacesNearLocation = searchPlacesNearLocation;
exports.toRadians = toRadians;
exports.getMaxDistance = getMaxDistance;
exports.getDistanceScore = getDistanceScore;
exports.getDistanceToPosition = getDistanceToPosition;
exports.getDistances = getDistances;
exports.prettify = prettify;
exports.prettifyWithPosition = prettifyWithPosition;
