'use strict';

var express = require('express');

var app = express();

var bodyParser = require('body-parser');
// create application/json parser 
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser 
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var views = [
				'about',
				'eat',
				'exercise',
				'film-reviews',
				'film-reviews/film-reviews-search-results',
				'film-reviews/film-review',
				'play',
				'test',
				'travel'
			];

//Set up static server to server static files (e.g. .css and .js files), as opposed to dynamic files (e.g. .jade files)
app.use('/static', express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//Potential future code using developer-created node module:
//Database:
/*var database = require('./appRequirements/_database.js'); 
var connection = database.makeConnection();
console.log(connection.threadId);*/

//Require mysql node module and establish connection to database for matthewdhuntley.com:
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  port : '8889',
  database : 'matthewdhuntley'
});

var connected = false;

//Attempt to connect to matthewdhuntley.com Database prior to app startup:
connection.connect(function(err) {
  if (err) {
  	console.log(err.code);
  	console.log(err);
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  connected = true;

  //Confirm connection:
  console.log(connected);
  console.log('connected as id ' + connection.threadId);
});

//Handle Database connection errors:
connection.on('error', function(err){
	console.log(err.code);
	if(err.code === 'PROTOCOL_CONNECTION_LOST')
		connection.destroy();
		connected = false;
	if(err.fatal)
		//console.log("Fatal error");
		connection.destroy();
		connected = false;
	if(!err.fatal)
		//console.log("Non-fatal error");
		connection.destroy();
		connected = false;
	  	return;
	if(err.code !== 'PROTOCOL_CONNECTION_LOST')
		throw err;
		connection.destroy();
});

function checkConnection(value = 'index') {
	if(!connected) {
		connection = mysql.createConnection({
		  host     : 'localhost',
		  user     : 'root',
		  password : 'root',
		  port : '8889',
		  database : 'matthewdhuntley'
		});

		connection.connect(function(err) {
		  if (err) {
		  	console.log(err.code);
		  	console.log(err);
		    console.error('error connecting: ' + err.stack);
		    return;
		  }
		 
		  connected = true;
		  console.log(connected);
		  console.log('connected as id ' + connection.threadId);
		});
	} else {
		console.log("Already connected.");
	}
}

//Render home page
app.get('/', function(req, res) {
	
	//Check connection with each home page request:
	checkConnection();

	var path = req.path;
	res.locals.path = path; //This locals object is what get rendered in the template; it's the same as writing "res.render('index', { path: path });"
	res.render('index');
});

//Render subpages
views.forEach(function(value, index) {
	app.get('/' + value, function(req, res) {
		var path = req.path;
		res.locals.path = path; 

		if((value=="film-reviews" || value=="film-reviews/film-review") && req.query.search) {
			console.log(req.query.search);
			var myString = 'SELECT * FROM film_reviews WHERE title LIKE "%'+req.query.search+'%"';
			console.log("mystring = "+myString);
			console.log(typeof myString);

			//If there's a Database connection:
			if(connected) {
				connection.query(myString, function (error, results, fields) {
					if(error) {
						throw error;
					} else {
						res.render('film-reviews/film-reviews-search-results', {data: results});
					}
					/*if(results.length === 0) {
						res.render('film-reviews/film-reviews-search-results', {data: results});
					} else if(results.length > 0) {
						console.log('The result is: ', results[0].review);
				    	res.render('film-reviews/film-reviews-search-results', {data: results});
					} else if (error) throw error;*/
				});
			} else { //Else...
				//...attempt to establish a Database connection...
				connection = mysql.createConnection({
				  host     : 'localhost',
				  user     : 'root',
				  password : 'root',
				  port : '8889',
				  database : 'matthewdhuntley'
				});

				connection.connect(function(err) {
					//If no connection was established:
					if (err) {
						console.log(err.code);
						console.log(err);
						console.error('error connecting: ' + err.stack);
						res.render('film-reviews/film-reviews-search-results', {noConnection: 'No database connection.'});
						return;
					}
				 
					//If a connection was established:
					connected = true;
					console.log(connected);
					console.log('connected as id ' + connection.threadId);

				  	//...and continue with the query....
					connection.query(myString, function (error, results, fields) {
						if(error) {
							throw error;
						} else {
							res.render('film-reviews/film-reviews-search-results', {data: results});
						}

						/*if(results.length === 0) {
							
						} else if(results.length > 0) {
							console.log('The result is: ', results[0].review);
					    	//res.render(value);
					    	//res.send("Hello");
					    	res.render('film-reviews/film-reviews-search-results', {data: results});
						} else if (error) throw error;*/
					});
				});
			}
		} else if(value=="film-reviews/film-review") {
			res.render(value);
		} else {
			res.render(value);
		}
	});
});

//Film reviews pages form search:
app.post('/film-reviews/film-review', function(req,res){
	//console.log(req);
	/*console.log(data);*/
	console.log(req.body);
	console.log(req.body.title);
	console.log(req.body.review);
	console.log("Hello");
	res.render('film-reviews/film-review', {test : req.body});
});

//Start the node server
app.listen(process.env.PORT || 3000, function() {
	console.log("The frontend server is running on port 3000!");
});
