/*
	Author: Tresor Cyubahiro
	Date: 08.15.2019
	Description: Unit tests
*/

var assert = require('assert');
var serverHelper = require('./serverHelper');
var testData = require('./testData');

describe("toRadians", function () {
	it("Returns a radian value given degrees", () => {
		const degrees = 90;
		const result = serverHelper.toRadians(degrees).toFixed(4);
		assert.deepEqual(result, 1.5708);
	});
});

describe("getMaxDistance", function () {
	it("Returns maximum distance from an array of distances", () => {
		const distances = [ 
							{ distanceFromUser: 0 }, 
							{ distanceFromUser: -1 }, 
							{ distanceFromUser: 9 }, 
							{ distanceFromUser: 3 },
							{ distanceFromUser: 3 },
							{ distanceFromUser: 2 }
						];
		const result = serverHelper.getMaxDistance(distances);
		assert.deepEqual(result, 9);
	});
});

describe("getDistanceScore", function () {
	it("Returns a score for place's distance from given location, relative to other places found", () => {
		const distance = 12;
		const maxDistance = 36;
		const result = serverHelper.getDistanceScore(distance, maxDistance).toFixed(1);
		assert.deepEqual(result, 0.7);
	});
});

describe("getDistanceToPosition", function () {
	it("Returns distance between two geographical points", () => {
		const latitude1 = 30, 
			longitude1 = 100, 
			latitude2 = 20, 
			longitude2 = 80;

		const result = serverHelper.getDistanceToPosition(latitude1, longitude1, latitude2, longitude2);
		assert.deepEqual(result, 2296580);
	});
});
