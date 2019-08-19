A REST API which provides auto-complete suggestions for places in large cities. Built with Nodejs and Express framework, and MongoDB. It uses geo data from Geonames.org and extracts it to create a database of the places on the server. 

## How to run the project
	
Prerequisites:
- npm, node, mongo shell must be installed on your machine
- versions used in development and testing are:
	- npm v6.4.1
	- node v10.15.0
	- mongo shell v4.0.3 (Installation instructions here: https://docs.mongodb.com/manual/installation/)
- Download file US.zip from Geonames.org (http://download.geonames.org/export/dump/), extract it and copy file US.txt and paste it in project folder.

1. After mongo is installed, start mongo shell, and enter:
	- `use findItDb` to create database
	- `db.createCollection("usCities")` to create collection for storing place names and their properties

2. cd into project folder and run `npm install` to install all dependencies as seen in `./package.json`
3. Run `npm init` to initialize and populate a mongoDB collection containing all
   the cities in file US.txt. Wait for the script to complete running (It may take a while depending on the data size).
4. Run `npm start` to start REST API server. 
5. Open your browser, and type `localhost:3000/suggestions?q=Temp`

## Documentation

I am using DocumentationJS to generate documentation for this project (https://documentation.js.org/)

## Tests

To run tests run `npm test`
	
## Request
	
	1. /suggestions?q=Mesa

		Results are sorted by search text match score in descending order.

	2. /suggestions?q=Mesa&latitude=40.69106&longitude=-109.95571

		Results are sorted by distance from user's location in descending order.

	## Optionally

		- maxDistance (only when latitude and longitude have been provided): for getting places whose distance from the given coordinates is less or equal to this distance.
		- paginate (whether to paginate results): 1 for paginate, 0 otherwise
		- paginationCount (only when paginate is 1): indicates which batch of results to return 
		- maxNumResults (default and maximum is 20): number of results to return

## Features
	
	- Retrieve suggestions based on search text. Suggestions are ordered by how close their names are to the search text. 
	- Retrieve suggestions based on search text and user's location. Suggestions are ordered by how close their location are to the user's location.
	- Set maximum distance from user.
	- Paginate results and set maximum number of results (1 to 20, 20 by default). This is useful in case there is a large list of results. With this feature, one would be able to lazy load results in the user interface.

## Database collection schema

	Example record: `{
		"_id": "5d58c3cd1cfcc60a578887ad",
		"name": "Mesa Mall", ----> Indexes for quick text search
		"asciiname": "Mesa Mall",
		"alternateNames": "",
		"countryCode": "US",
		"timeZone": "America/Denver",
		"location":{
			"type": "Point",
			"coordinates": [-108.58954,39.08387]
		}
	}`

	Adopted from data structure from Geonames.org

## Improvements
	- Sort results by both text match score and distance to a provided location. Results are sorted by either search text match score or distance from user, but not both.
	- Distributed database so that searches are faster.
	- Make searches global. Currently designed for one region (All cities in the U.S.).
	- Support multiple language searches. Only supports english currently.


## TODO (Not completed as of 08.18.2019)
	- Error logging
	- Extensive unit tests
	- Hosting on Heroku
	- Refactor


Revised: 08.15.2019
