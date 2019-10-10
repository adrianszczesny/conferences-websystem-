var mysql 		= require("mysql");
var express 	= require('express');
var app 		= express();
var path 		= require("path");
var bcrypt = require('bcryptjs');
var router = express.Router();
var mydate = require('current-date');

	var bodyParser = require('body-parser');

	app.use(bodyParser.urlencoded({ extended: true }));

    app.use(bodyParser.json());

	var cookieParser = require('cookie-parser');

	var session = require('express-session');

	router.use(session({ secret: 'app', cookie: { maxAge: 1*1000*60*60*24*365 }}));

	router.use(cookieParser());

// Inicjalizacja bazy danych 
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
router.use(express.static("../public"));

 //odnosniki 
router.get('/', function(req, res) {
	addRouteInfo(req);
    console.log(req.session.routerInfo);
    console.log("id");
    console.log(req.session.user);
    res.render("pages/home", { req: req.session.user, logout: false});
});

//logowania
router.get('/loginPage', function (req, res) {
    res.render("pages/login", { req: req.session.user, error: false, mail: false, password: false });
});


// rejestracji
router.get('/registerPage', function(req,res) {
	res.render('pages/register', {req: req.session.user});
})

router.post('/register', function (req, res) {
    console.log(req.body.email);
    console.log(req.body.password);

    if (req.body.email == '' || req.body.password == '') {
		res.render('pages/register', {req: req.session.user, noInput: true})
	}
	else {
		
            bcrypt.hash(req.body.password, 10 , function (err, p_hash) {
                console.log(p_hash);
                let haslo = p_hash;
                let imie = req.body.name;
                let email = req.body.email;
				
				connection.query('INSERT INTO user (imie, email, password) VALUES (?, ?, ?)', [imie, email, haslo], function (error, results, fields) {
					
                    // unikatowy login
                    if (error) res.render('pages/register', { req: req.session.user, error: true });
					else res.render('pages/login', {req: req.session.user});
				});
			});
		
	}
});

router.post('/login', function(req,res) {
	loginAuth(req, res, '')	
})

//wylogowania
router.get('/logoutPage', function (req, res) {
    req.session.user = null;
    res.render('pages/home', { req: req.session.user, logout: true });
})

router.post('/logout', function(req,res) {
        req.session.user = null;
        req.session.destroy(function (err) {
            req.session = null;
            if (err) console.log(err);
        })
    res.render('pages/home.ejs', { req: req.session.user, logout: true });
		
});

router.get('/list', function (req, res) {
    list(req, res, '');
});

router.get('/mylist', function (req, res) {
    mylist(req, res, '');
});
router.get('/buy::id', function (req, res) {
    console.log(req.params.user);
    buy(req, res, '');
    list(req, res, '');
});

router.get('/info::id', function (req, res) {
    info(req, res, '');
});

router.get('/account', function (req, res) {
    account(req, res, '');
});

function account(req, res) {
        connection.query('SELECT * FROM user WHERE id_User = ?', [req.session.user], function (error, result, fields) {
            res.locals.account = result;
            console.log(result);
            res.render('pages/client/account.ejs', { req: req.session.user, account: res.locals.account });
        });
    }


function info(req, res, url) {
    let even = req.params.id;
    connection.query('SELECT event.topic, trainer.Name, trainer.description, event.city, event.date, event.hotel, event.price, event.id_event, event.descriptions FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.id_event= ? ',[even], function (error, result, fields) {
        console.log(result);
        console.log("info oooo ");
        var date = result[0].date;
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        result[0].date = day + '.' + month + '.' + year;
        console.log("info oooo jjjjj ");

        res.locals.tabresult = result;
        res.render('pages/client/info', { req: req.session.user, tabresult: res.locals.tabresult });
    });
}



function buy(req, res, url) {
    let even = req.params.id;
    let us = req.session.user;
    let state = 1;
    let date = mydate('date');
    connection.query('INSERT INTO application(id_event, id_User, state, date) VALUES (?, ?, ?, ?)', [even, us, state,date], function (error, result, fields) {
        console.log(req.params.id);
        console.log(req.session.user);
        console.log("Dodano");
        });
}

function list(req, res, url) {

    connection.query('SELECT event.topic, trainer.Name, event.city, event.date, event.price, event.id_event FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.state=1', function (error, result, fields) {
        console.log(result);
        let tabresult = [];
        for (let i = 0; i < result.length; i++) {
            var date = result[i].date;
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            result[i].date = day + '.' + month + '.' + year;
       
        }

        res.locals.tabresult = result;
        res.render('pages/client/list', { req: req.session.id, tabresult: res.locals.tabresult });
    });
}


function mylist(req, res, url) {

    connection.query('SELECT event.topic, trainer.Name, event.city, event.date, event.price, event.id_event, application.rabat FROM trainer INNER JOIN event ON trainer.id_trainer = event.id_trainer INNER JOIN application ON event.id_event = application.id_event WHERE application.id_User= ? ',[req.session.user], function (error, result, fields) {
        var currentdate = mydate('date');
        console.log(currentdate);
        console.log(result);
        console.log("sessionnid");
        console.log(req.session.user);
        res.locals.mytabresult = [];
        res.locals.lastmytabresult = [];
        let j = 0;
        let n = 0;

        for (let i = 0; i < result.length; i++) {
            console.log(result[i].date);
            let date = result[i].date;
            var year = date.getFullYear();
            let month = date.getMonth();
            let day = date.getDate();
            result[i].date = day + '.' + month + '.' + year;

            if (result[i].date < currentdate) {

             
                result[i].price = result[i].price - result[i].rabat;
                res.locals.mytabresult[j++] = result[i];
            }
            else {
               
                result[i].price = result[i].price - result[i].rabat;
                res.locals.lastmytabresult[n++] = result[i];

            }
         
        }

    res.render('pages/client/mylist', { req: req.session.id, mytabresult: res.locals.mytabresult, lastmytabresult: res.locals.lastmytabresult });
    });
   
}

function loginAuth(req, res, url) {

    if (req.body.email == '') {
		
		res.render('/loginPage', {req: req.session.user, noInput: true});
		
	} else {
		loginAuthQuery(req, res, url);
	}
}

function loginAuthQuery(req, res, url) {
	
    connection.query('SELECT * FROM user WHERE email = ?', [req.body.email], function (error, result, fields) {
        console.log(result);
		
        if (result.length == 0 || error) {
            res.render('pages/login', { req: req.session.user, error: true, email: true, password: null });
        }
        else {
			
            bcrypt.compare(req.body.password, result[0].password, function (err, results) {
                console.log("good");

                if (results == true) {
                    console.log("1");
                    req.session.user = result[0].id_User;
                    console.log(result[0].id_User);
                    console.log("2");
                    req.session.UserName = result[0].imie;
                    console.log("3");
                    console.log(req.session.id);
                    console.log("4");
                    res.render('pages/home', { req: req.session.user, logout: false});
                }
                else {
                    console.log("bad");
                    res.render('pages/login', { req: req.session.user,  error: true, password: true, email: null});
                }
		  	});
		}
	});
}

module.exports = router;










