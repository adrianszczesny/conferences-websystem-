// requiring packages
var express = require('express');
var app 	= express();
var path 	= require("path");
var mysql   = require('mysql');
var router = express.Router();
var mydate = require('current-date');

//session stuff
	var cookieParser = require('cookie-parser');

	var session = require('express-session');

	//allow sessions
	router.use(session({ secret: 'app', cookie: { maxAge: 1*1000*60*60*24*365 }}));

	router.use(cookieParser());

app.set('view engine','ejs');
//you need this to be able to process information sent to a POST route
	var bodyParser = require('body-parser');

	// parse application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ extended: true }));

	// parse application/json
	app.use(bodyParser.json());

var path = require("path");

// Serve static content for the app from the "public" directory in the application directory.
// you need this line here so you don't have to create a route for every single file in the public folder (css, js, image, etc)
// index.html in the public folder will over ride the root route
app.use(express.static("public"));

// Initializes the connection variable to sync with a MySQL database
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "",
  database: "websystem"
});

var User = require('./routes/user.js');
app.use('/', User);


// this is the api where we can grab information and use it in the 


// This global function will return the time when this function was called.
global.getTime = function() {
	var timeStamp = new Date();
	var startTime = timeStamp.getDate() + "/"
                + (timeStamp.getMonth()+1)  + "/" 
                + timeStamp.getFullYear() + " @ "  
                + timeStamp.getHours() + ":"  
                + timeStamp.getMinutes() + ":" 
                + timeStamp.getSeconds();

    return startTime;
}

// This global function will save the url the user was on and the time they enntered the route
global.addRouteInfo = function(req, url) {

	if((typeof req.session.routerInfo != 'undefined') && (typeof url == 'undefined')) {
		req.session.routerInfo.push({route: req.originalUrl, time: getTime()});
		return true;
	} else if ((typeof req.session.routerInfo != 'undefined') && (typeof url != 'undefined')) {
		req.session.routerInfo.push({route: url, time: getTime()});
		return true;
	} else return false;
}


app.listen(3000, function(){
	console.log('Serwer uruchomiony na porcie: 3000');
});

















































