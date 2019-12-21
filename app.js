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
				'leisure',
				'test',
				'travel'
			];

//Set up static server to server static files (e.g. .css and .js files), as opposed to dynamic files (e.g. .jade files)
app.use(express.static('public'));
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

var mysql = require('mysql');

//Declare pool object for mysql node module w/ local database:
/*var pool  = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  port : '8889',
  database : 'matthewdhuntley'
});*/

//Declare pool object for mysql node module w/ Herokus database:
var pool  = mysql.createPool({
	connectionLimit : 10,
	host     : 'us-cdbr-iron-east-03.cleardb.net',
	user     : 'bd16f9aa3f67c9',
	password : '95cc362c',
	database : 'heroku_af028f2224ccdc7'
});

//Attempt to connect to matthewdhuntley.com database on app startup:
pool.getConnection(function(err, connection) {
	if(!connection) {
		console.log("Not connected.");
		console.log(err);
	} else if(connection) {
		console.log("Initial app startup connection made.");
  		console.log(connection.threadId);
	}
});

/*Pool events for tracking purposes*/
pool.on('connection', function (connection) {
  console.log('Connection event thrown.');
});

pool.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});

//Render home page
app.get('/', function(req, res) {
	var path = req.path;
	res.locals.path = path; //This locals object is what get rendered in the template; it's the same as writing "res.render('index', { path: path });"
	res.render('index', {id: 'home'});
});

//Render subpages
views.forEach(function(value, index) {
	app.get('/' + value, function(req, res) {
		var path = req.path;
		res.locals.path = path; 

		if((value=="film-reviews" || value=="film-reviews/film-review") && req.query.search) {
			//console.log(req.query.search);
			var myString = 'SELECT * FROM film_reviews WHERE title LIKE "%'+req.query.search+'%"';
			//console.log("mystring = "+myString);
			//console.log(typeof myString);

			pool.getConnection(function(err, connection) {
				if(err) {
					res.render('film-reviews/film-reviews-search-results', {noConnection: 'No database connection.'});
					return;
				} else if(connection) {
					// Use the connection
					connection.query(myString, function (error, results, fields) {

				  	res.render('film-reviews/film-reviews-search-results', {data: results, id: 'film-reviews-search-results'});
				    
				    // Release connection back into the pool; NOTE: Connection is still "alive" at this point.
				    connection.release();

				    //Destroy connection; NOTE: Connection is now dead/non-existent;
				    //Adding this code just as a more surefire way to avoid fatal database connection issues; 
				    //This is likely not necessary, but playing it safe for now:
				    connection.destroy();

				    // Handle error after the release.
				    if (error) throw error;

				    // Don't use the connection here, it has been returned to the pool.
				  });
				}
			});
		} else if(value=="film-reviews/film-review") {
			res.render(value, {id: 'film-review'});
		} else {
			res.render(value, {id: value});
		}
	});
});

//Film reviews pages form search:
app.post('/film-reviews/film-review', function(req,res){
	//console.log(req);
	//console.log(data);
	//console.log(req.body);
	//console.log(req.body.title);
	//console.log(req.body.review);
	//console.log(req.body.image);
	res.render('film-reviews/film-review', {id: 'film-review', resultsKey : req.body});
});

//Start the node server
app.listen(process.env.PORT || 3000, function() {
	console.log("The frontend server is running on port 3000.");
});
