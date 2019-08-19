/*
	Author: Cyubahiro Tresor
	Date: 08.15.2019
	Description: File containing helper functions for a local mongo database containing geo records for US cities. 
*/

const mongojs = require('mongojs');
const db = mongojs('findItDb', ['usCities']);

/**
	Function to add a new record to the usCities collection
	@param {object} record
	@returns {Promise} a promise that returns the state of the added value
*/
exports.addUSRecord = function(record) {
	return new Promise(function(resolve, reject) {
		db.usCities.save((record), function (err, result) {
			if (err) {
				reject(err);
			}
			resolve(result);
		});
	});
}

/**
	Function to add a new record to the usCities collection. For testing purposes
	@returns {Promise} a promise that returns a value
*/
exports.getAUsCityRecord = function() {
	return new Promise(function(resolve, reject) {
		db.usCities.findOne(({}), function (err, docs) {
			if (err) {
				reject(err);
			}
			resolve(docs);
		});
	});
}

/**
	Function to remove all records. Only for collection re-initialization, do not expose directly to REST API. Should call before calling any AddUSRecord to prevent duplicates. Note: may take long to complete. on large data sets.
	@returns {Promise} a promise that returns the state of the deletion
*/
exports.clearUsCitiesRecords = function() {
	return new Promise(function(resolve, reject) {
		db.usCities.remove(({}), function (err, status) {
			if (err) {
				reject(err);
			}
			resolve(status);
		});
	});
}

/**
	Function to add a new record to the usCities collection
	@param {string} searchText
	@param {number} maxNumOfResults
	@param {number} paginationCount
	@returns {Promise} a promise that returns found places
*/
exports.searchPlaces = function(searchText, maxNumOfResults, paginationCount) {
	return new Promise(function(resolve, reject) {
		let query = { $and: [

								{name: {$regex: new RegExp('^' + searchText), $options: "i"}},
								{$text: {$search: searchText}}
							]
					};
		db.usCities.find(query, {score: {$meta: "textScore"}}).sort({score: { $meta: "textScore"}}).limit(maxNumOfResults).skip( maxNumOfResults * paginationCount, function (err, docs) {
			if (err) {
				reject(err);
			}
			resolve(docs);
		});
	});
}

/**
	Function to remove all records. Only for collection re-initialization, do not expose directly to REST API. Should call before calling any addUSRecord to prevent duplicates. Note: may take long to complete. on large data sets.
	@returns {Promise} a promise that returns the state of index creation
*/
exports.createIndexes = function() {
	return new Promise(function(resolve, reject) {
		db.usCities.createIndex(({ name: "text" }), function(err, status) {
			if (err) {
				reject(err);
			}
			resolve(status);
		});
	});
}