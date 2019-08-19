/*
	Author: Cyubahiro Tresor
	Date: 08.15.2019
	Description: REST API endpoint that provides auto-complete suggestions for places in large cities. Using records for US Cities as provided by Geonames.org.

	Note: This is a minimal setup of a REST API.
*/

var express = require('express');
var app = express();
var helper = require('./serverHelper');
const defaultMaxNumResults = 20;

/**
	Endpoint for retrieving auto-complete suggestions for places in large cities.
	@param {string} query
	@param {number} latitude (optional)
	@param {number} longitude (optional)
	@param {number} maxDistance (optional)
	@param {number} paginate (optional) - 0 for no pagination, 1 otherwise
	@param {number} paginationCount (optional)
	@param {number} maxNumResults (20 by default)
	@returns {object} http response
*/
app.get('/suggestions', async function (req, res) {
	var query = req.query.q,
		latitude = req.query.latitude,
		longitude = req.query.longitude,
		maxDistance = req.query.maxDistance,
		paginate = req.query.paginate,
		paginationCount = req.query.paginationCount,
		maxNumResults = req.query.maxNumResults !== undefined && typeof req.query.maxNumResults !== "number" && req.query.maxNumResults <= 20? req.query.maxNumResults : defaultMaxNumResults;

	// Check for valid query
	if (query === undefined || query === "") {
		res.status(400).end('Invalid request. Query should be a non-empty string');
		return;
	}

	// Check for valid paginate indicator value
	if (paginate !== undefined) {
		try {

			let paginateValue = parseInt(paginate);

			if (paginateValue !== 0 && paginateValue !== 1) {
				res.status(400).end('Invalid request. paginate value must be 0 or 1');
				return;
			} else {
				if (paginateValue === 0) { 
					paginate = false;
				} else {
					paginate = true;
				}
			}

		} catch (err) {
			res.status(400).end('Invalid request. paginate value must be 0 or 1');
			return;
		}
	} 

	// Check for valid paginate count value
	if (paginate) {

		try {

			let paginationCountValue = parseInt(paginationCount);
			if (paginationCountValue < 0) {
				res.status(400).end('Invalid request. pagination paginationCount value must be a number 0 - N');
				return;
			} else {
				paginationCount = paginationCountValue;
			}

		} catch(err) {
			res.status(400).end('Invalid request. pagination paginationCount value must be a number 0 - N');
			return;
		}
	} else {
		paginationCount = 0;
	}

	// Both latitude and longitude are provided
	if (latitude !== undefined && longitude !== undefined) {

		try {

			let results,
				latitudeFloat = parseFloat(latitude),
				longitudeFloat = parseFloat(longitude);

				// Check for valid numbers
				if (isNaN(latitudeFloat) || isNaN(longitudeFloat)) {
					res.status(400).end('Invalid request. Lat/Lon should be numbers');
					return;
				}

			if (maxDistance !== undefined) {
				
				let maxSearchDistance = parseInt(maxDistance);

				results = await helper.searchPlacesNearLocationWithMaxDistance(query, latitudeFloat, longitudeFloat, maxSearchDistance, maxNumResults, paginationCount);
			} else {
				results = await helper.searchPlacesNearLocation(query, latitudeFloat, longitudeFloat, maxNumResults, paginationCount);					
			}

			if(results.success) {
				let prettified = await helper.prettifyWithPosition(results.found);
				res.status(200).send(JSON.stringify({"suggestions": prettified}));
			} else {
				res.status(200).send(JSON.stringify({"suggestions": []}));
			}

		} catch(err) {
			res.status(500).end('Unkown error occured');
			return;
		}

	} else {
		try {
			var results = await helper.searchForPlaces(query, maxNumResults, paginationCount); 

			if(results.success) {
				let prettified = await helper.prettify(results.found);
				res.status(200).send(JSON.stringify({"suggestions": prettified}));
			} else {
				res.status(200).send(JSON.stringify({"suggestions": {}}));
			}
		} catch (err) {
			res.status(500).end('Unkown error occured');
			return;
		}
	}
});

app.listen(3000);