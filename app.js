'use strict';

var express = require('express');

var app = express();

var views = [
				'about',
				'eat',
				'exercise',
				'film-reviews',
				'play',
				'travel'
			];

//Set up static server to server static files (e.g. .css and .js files), as opposed to dynamic files (e.g. .jade files)
app.use('/static', express.static(__dirname + '/public'));

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

//Render home page
app.get('/', function(req, res) {
	//res.send("<h1>I am in love with Treehouse</h1>");
	var path = req.path;
	res.locals.path = path; //This locals object is what get rendered in the template; it's the same as writing "res.render('index', { path: path });"
	res.render('index');
});

//Render subpages
views.forEach(function(value, index) {
	app.get('/' + value, function(req, res) {
		var path = req.path;
		res.locals.path = path; 
		res.render(value);
	});
});

//
app.listen(process.env.PORT || 3000, function() {
	console.log("The frontend server is running!");
});
