var mysql 		= require("mysql");
var express 	= require('express');
var app 		= express();
var path 		= require("path");
var bcrypt = require('bcryptjs');
var router = express.Router();
var mydate = require('current-date');
var fileUpload = require('express-fileupload');
var multer = require('multer');
var fs = require('fs');

var puppeteer = require('puppeteer');
var ejs = require('ejs');
var path = require('path');
var nodemailer = require('nodemailer');




	var bodyParser = require('body-parser');

	app.use(bodyParser.urlencoded({ extended: true }));

    app.use(bodyParser.json());

	var cookieParser = require('cookie-parser');

	var session = require('express-session');

	router.use(session({ secret: 'app', cookie: { maxAge: 1*1000*60*60*24*365 }}));

    router.use(cookieParser());

var storage_program = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './programs');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

var program = multer({ storage: storage_program });

var storage_zgloszenie = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './zgloszenie');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

var file_zgloszenie = multer({ storage: storage_zgloszenie });





var transporter = nodemailer.createTransport({
    host: 'poczta.o2.pl',
    secure: false,
    port: 587,
    ssl: false,
    ignoreTLS: false,
    requireTLS: true,
    auth: {
        user: '###########',
        pass: '###########'
    },
    tls: {
        secureProtocol: "TLSv1_2_method",
        rejectUnauthorized: false
    }
});






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

/*         *
 * CLIENT  *
 */        

//home
router.get('/', (req, res) =>  {
	addRouteInfo(req);
    console.log(req.session.routerInfo);
    console.log("id:" + req.session.user );
    res.render("pages/home", { req: req.session.user, logout: false});
});

//logowanie
router.get('/loginPage', (req, res) =>  {
    res.render("pages/login", { req: req.session.user, error: false, mail: false, password: false });
});

router.post('/login', (req, res) => {
    loginAuth(req, res, '')
});

// rejestracja
router.get('/registerPage', (req, res) => {
    res.render('pages/register', { req: req.session.user, email: false, password: false });
});

router.post('/register', (req, res) =>  {
    console.log(req.body.email);
    console.log(req.body.password);

    if (req.body.email == '' || req.body.password == '') {
        res.render('pages/register', { req: req.session.user, noInput: true })
    }
    else {
        if (req.body.password == req.body.password2) {
            connection.query('SELECT * FROM user WHERE email = ?', [req.body.email], function (error, result, fields) {
                if (result.length != 0) {
                    console.log(result.length);
                    res.render('pages/register.ejs', { req: req.session.user, email: true, password: false });
                }
            });

            bcrypt.hash(req.body.password, 10, function (err, p_hash) {
                console.log(p_hash);
                let haslo = p_hash;
                let email = req.body.email;

                connection.query('INSERT INTO user ( email, password) VALUES (?, ?)', [email, haslo], function (error, results, fields) {

                    // unikatowy login
                    if (error) res.render('pages/register', { req: req.session.user, error: true });
                    else res.render('pages/login', { req: req.session.user,error: false, email: false, password: false });
                });
            });

        }
        else {
            res.render('pages/register.ejs', { req: req.session.user, email: false, password:true });
        }
    }
});

//wylogowanie
router.get('/logoutPage', (req, res) => {
    req.session.user = null;
    res.render('pages/home', { req: req.session.user, logout: true });
})

router.post('/logout', (req, res) =>  {
        req.session.user = null;
        req.session.destroy((err) => {
            req.session = null;
            if (err) console.log(err);
        })
    res.render('pages/home.ejs', { req: req.session.user, logout: true });
		
});

router.get('/reset', (req, res) => {
    res.render('pages/reset.ejs', { req: req.session.user, error: false });
});

router.post('/reset', (req, res) => {
    connection.query('SELECT * FROM user WHERE email= ?', [req.body.email], (error, result, fields) => {
        console.log(req.body.email);
        console.log(result);
        if (result.length < 1) {
            res.render('pages/reset.ejs', { req: req.session.user, error: true });
        }
        else {

            let jak = "jakis tekst blablablabla";
            var mailOptions = {
                from: '###############',
                to: '###############',
                subject: 'Resetowanie hasla',
                text: 'Twoje nowe haslo to : !' + jak 
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email wysłany: ' + info.response);
                }
            });

        }
    })

});



//lista aktualnych szkolen
router.get('/list', (req, res) =>  {
    list(req, res, '');
});

router.get('/info/download::id', (req, res) => {
    console.log(req.params.id)
    connection.query('SELECT program FROM event WHERE id_event= ?', [req.params.id], (error, result, fields) => {

        console.log(result[0].program);
        console.log(path.join(__dirname, '/..', result[0].program));
        res.download(path.join(__dirname, '/..', result[0].program));
    });
});

// lista szkolen, na ktore user jest zapisany
router.get('/mylist', (req, res) =>  {
    mylist(req, res, '');
});

//formularz zgloszeniowy
router.get('/buy::id', (req, res) => {
    console.log(req.params.user);
    prebuy(req, res, '');
});

//informacje o szkoleniu
router.get('/info::id', (req, res) => {
    info(req, res, '');
});

// dane uzytkowanika 
router.get('/account', (req, res) => {
    account(req, res, '');
});

// aktualizacja danych uzytkownika
router.post('/update', (req, res) => {
    update(req, res, '');  
});

//zapisanie sie na szkolenie
router.post('/buy::id', (req, res) => {
    buy(req, res, '');
});

//szczegoly zamowienia
router.get('/details::id', (req, res) => {
    details(req, res, '');
});

//usuwanie uczestnika z zamowienia
router.get('/deleteapp::id', (req, res) => {
    deleteapp(req, res, '');
});

router.get('/zgloszenie::id', (req, res) => {
    zgloszenie(req, res, '');
});

router.post('/addzgloszenie::id', file_zgloszenie.single('zgloszenie'), (req, res) => {
    addzgloszenie(req, res, '');
});

router.get('/showprogram::id', (req, res) => {
    showprogram(req, res, '');
});


router.get('/addnewuser', (req, res) => {
    addnewuser(req, res, '');
});

/*
 * MANAGER
 */

//glowna 
router.get('/work', (req, res) => {
    if (req.session.user != undefined && req.session.admin==true) {
        conferences(req, res, '')
    }
    else {
        res.render("pages/work/login", { req: req.session.user, error: false, mail: false, password: false });
    }
   
});

//logowanie
router.post('/login-worker', (req, res) => {
    loginAuthWork(req, res, '')
});

//lista aktualnych szkolen
router.get('/conferences', (req, res) => {
    if (req.session.user != undefined && req.session.admin == true) {
        conferences(req, res, '')
    }
    else {
        res.render("pages/work/login", { req: req.session.user, error: false, mail: false, password: false, admin:false });
    }
});

//lista szkolen archiwalnych 
router.get('/lastconfernces', (req, res) => {
    lastconferences(req, res, '');
});

//form nowe szkolenie
router.get('/newevent', (req, res) => {
    newevent(req, res, '');
});

//dodanie nowego szkolenia
router.post('/newevent', program.single('program'), (req, res) => {
    addnewevent(req, res, '');
});

//informacje o szkoleniu
router.get('/eventdetails::id', (req, res) => {
    eventdetails(req, res, '');
});

//edytowanie szkolenia
router.get('/editevents::id', (req, res) => {
    geteditevent(req, res, '');
});

//wprowadzenie zmian w szkoleniu
router.post('/editevent::id', program.single('program'), (req, res) => {
    posteditevent(req, res, '');
});

//odwołanie szkolenia
router.get('/deleteevent::id', (req, res) => {
    let event = req.params.id;

    connection.query('UPDATE event SET state = 2 WHERE id_event = ?', [event], (error, result, fields) => { });
    conferences(req, res, '')
});

//przywracanie szkolenia
router.get('/reevent::id', (req, res) => {
    let event = req.params.id;
    connection.query('UPDATE event SET state = 1 WHERE id_event = ?', [event], (error, result, fields) => { });
    conferences(req, res, '')
});

//dodwanie rabatu
router.post('/addrabat::id', (req, res) => {
    let rabat = req.body.rabat;
    let app = req.body.application;
    let company = req.body.company;
    let event = req.body.event;
    console.log(rabat);
    console.log(app);
    connection.query('SELECT application.id_application FROM application INNER JOIN user ON application.id_User = user.id_User INNER JOIN company ON user.id_company = company.id_company  WHERE company.id_company = ? AND application.id_event = ?', [company,event], (error, list, fields) =>{
            
        for (let i = 0; i < list.length; i++) {
            connection.query('UPDATE application SET rabat = ? WHERE id_application = ?', [rabat, list[i].id_application], (error, result, fields) => { });
            if (i >= list.length -1 ) {
                res.redirect('/showapplication:' + app);
            }
        }
   
   
    });
});

//wyswietlenie informacji o uzytkowniku
router.get('/showuser::id', (req, res) => {
    showuser(req, res, '');
});

//wyswietlenie informacji o instytucji
router.get('/showcompany::id', (req, res) => {
   showcompany(req, res, '');
});

//wyswietlanie informacji o zgloszeniu
router.get('/showapplication::id', (req, res) => {
    showapplication(req, res, '');
});

router.get('/showzgloszenie::id', (req, res) => {
    showzgloszenie(req, res, '');
});

//usuniecie pracownika z firmy
router.get('/removecompany::id', (req, res) => {
    let user = req.params.id;
    connection.query('UPDATE user SET id_company = NULL WHERE id_User = ?', [user], (error, result, fields) => { });
});

//dodanie pracownika do firmy
router.get('/adduser::id', (req, res) => {
    let company = req.params.id;

});

router.post('/addnewcompany', (req, res) => {
    addnewcomapny(req, res, '');
});

router.post('/addnewuser',(req,res)=> {
    postaddnewuser(req, res, '');
});

router.get('/finishfv::id', (req, res) => {
  finishfv(req, res, '');
});


router.get('/finishcert::id', (req, res) => {
    finishcert(req, res, '');
});

router.get('/finish::id', (req, res) => {
    finish(req, res, '');
});



router.get('/print::id', (req, res) => {
   print(req, res, '');
});


router.get('/printcertall::id', (req, res) => {
    printcertall(req, res, '');
});

router.get('/printcert::id', (req, res) => {
    printcert(req, res, '');
});

 /*
 * FUNKCJE
 */

 /*
 * CLIENT
 */

//POST logowanie 
function loginAuth(req, res, url) {

    if (req.body.email == '') {

        res.render('/loginPage', { req: req.session.user, noInput: true });

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
                    res.render('pages/home', { req: req.session.user, logout: false });
                }
                else {
                    console.log("bad");
                    res.render('pages/login', { req: req.session.user, error: true, password: true, email: null });
                }
            });
        }
    });
}

//GET dane uzytkowanika
function account(req, res) {
    connection.query('SELECT * FROM user LEFT JOIN company ON user.id_company = company.id_company WHERE id_User = ?', [req.session.user], function (error, result, fields) {
        res.locals.account = result;
        res.render('pages/client/account.ejs', { req: req.session.user, account: res.locals.account, update: false });
    });
}

//POST aktualizacja danych uzytkownika
function update(req, res) {
    return new Promise((resolve, reject) => {
        bcrypt.hash(req.body.haslo, 10, (err, p_hash) => {
            var haslo = p_hash;
            connection.query('UPDATE user SET email = ?, password= ?, imie = ?, nazwisko = ?, numer = ?, stanowisko = ? WHERE id_User = ?', [req.body.email, haslo, req.body.imie, req.body.nazwisko, req.body.numer, req.body.stanowisko, req.session.user], function (error, result, fields) { });
        });
        connection.query('SELECT id_company FROM user WHERE id_User= ?', [req.session.user], (error, result, fields) => {
            console.log(result);
            if (result[0].id_company == null) {
                console.log("jestem w firmie null");
                connection.query('INSERT INTO company (NIP, name, adres, name2, adres2, emailfv) VALUES (?, ?, ?, ?, ?, ?) ', [req.body.NIP, req.body.nazwa, req.body.adres, req.body.nazwa2, req.body.adres2, req.body.email2], function (error, results, fields) {
                    console.log("wstawione");
                    console.log(results.insertId);
                    connection.query('UPDATE user SET id_company = ? WHERE id_User= ?', [results.insertId, req.session.user], (error, resulty, fields) => { });
                    resolve(account(req, res));
                });

            }
            else {
                connection.query('UPDATE company SET name= ?, adres = ?, name2= ?, adres2 = ?,NIP = ?, emailfv= ?  WHERE id_company = ?', [req.body.nazwa, req.body.adres, req.body.nazwa2, req.body.adres2, req.body.NIP, req.body.email2, result[0].id_company], (error, results, fields) => {
                    resolve(account(req, res));
                });
            }
        });

    });
}

//GET lista aktualnych szkolen
function list(req, res, url) {
    var currentdate = mydate('date');
    connection.query('SELECT event.topic, trainer.Name, event.city, event.date, event.price, event.id_event FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.state=1 AND event.date > ? ORDER BY event.date ASC ', [currentdate], function (error, result, fields) {

        let tabresult = [];
        for (let i = 0; i < result.length; i++) {
            console.log("data x2");
            console.log(result[i].date);
            let date = result[i].date;
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate() - 1;
            result[i].date = day + '.' + month + '.' + year;
            console.log(result[i].date);

        }

        res.locals.tabresult = result;
        res.render('pages/client/list', { req: req.session.id, tabresult: res.locals.tabresult });
    });
}

//GET lista szkolen, na ktore uzytkownik jest zapisany
function mylist(req, res, url) {

    connection.query('SELECT MIN(application.id_application),application.id_application, event.id_event, event.topic, event.state, trainer.Name, event.city, event.date, event.price,  application.rabat FROM trainer INNER JOIN event ON trainer.id_trainer = event.id_trainer INNER JOIN application ON event.id_event = application.id_event WHERE application.id_User= ? OR application.id_zgl = ? GROUP BY event.date ASC ', [req.session.user, req.session.user], function (error, result, fields) {
        var currentdate = mydate('date');
        var parts = currentdate.split('-');
        var mydates = new Date(parts[0], parts[1]-1, parts[2]);
        console.log(mydates);
        console.log(currentdate);
        console.log(result);
        console.log("sessionnid");
        console.log(req.session.user);
        res.locals.mytabresult = [];
        res.locals.lastmytabresult = [];
        let j = 0;
        let n = 0;
        if (result != undefined) {
            for (let i = 0; i < result.length; i++) {

                console.log(result[i].date);
                              // currentdate = changedate(currentdate);
                console.log(mydates);

                if (result[i].date > mydates) {
                    result[i].date = changedate(result[i].date);

                    result[i].price = result[i].price - result[i].rabat;
                    res.locals.mytabresult[j++] = result[i];
                }
                else {
                    result[i].date = changedate(result[i].date);
                    result[i].price = result[i].price - result[i].rabat;
                    res.locals.lastmytabresult[n++] = result[i];

                }

            }
        }

        res.render('pages/client/mylist', { req: req.session.id, mytabresult: res.locals.mytabresult, lastmytabresult: res.locals.lastmytabresult });
    });

}

//GET informacje o szkoleniu
function info(req, res, url) {
    let even = req.params.id;
    connection.query('SELECT event.topic, trainer.Name, trainer.description, event.city, event.date, event.hotel, event.price, event.id_event, event.descriptions FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.id_event= ? ', [even], function (error, result, fields) {
        console.log(result);
        console.log("info oooo ");

        result[0].date = changedate(result[0].date);
        console.log("info oooo jjjjj ");

        res.locals.tabresult = result;
        res.render('pages/client/info', { req: req.session.user, tabresult: res.locals.tabresult });
    });
}

//GET formularz zgloszeniowy
function prebuy(req, res, url) {
    let even = req.params.id;
    let odbiorca = true;
    connection.query('SELECT event.topic, event.city, event.date, event.hotel, event.price, event.id_event, event.descriptions FROM event WHERE event.id_event= ? ', [even], function (error, result, fields) {
        console.log(result);
        console.log("info oooo ");
        let date = result[0].date;
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();
        result[0].date = day + '.' + month + '.' + year;

        res.locals.tabresult = result;

        connection.query('SELECT * FROM user LEFT JOIN company ON user.id_company = company.id_company WHERE id_User = ?', [req.session.user], function (error, results, fields) {
            res.locals.account = results;
            console.log("odb");
            console.log(results[0].name2);
            if (results[0].name2 == "") odbiorca = false;
            if (results[0].id_company == null) {
                res.render('pages/client/account', { req: req.session.user, update: true });
            }
            else {
                res.render('pages/client/application', { req: req.session.user, account: res.locals.account, tabresult: res.locals.tabresult, odb: odbiorca });
            }
        });
    });
}

//POST zapisanie na szkolenie
function buy(req, res, url) {
    let even = req.params.id;
    let state = 1;
    let date = mydate('full');
    let zw = null;
    let rabat = 0;
    console.log(req.body.check[0][1]);
    if (req.body.check[0][1] == 1) {
        zw = 1;
        console.log("zw" + zw);
    }
    console.log("ilosc osób:" + req.body.imie.length);
    let num = req.body.imie.length;
    if (req.body.imie.length > 1 && req.body.imie[0].length < 2) {
        num = 1;
        console.log("num" + num);
    }

    for (let i = 0; i < num; i++) {

        var szukanie = new Promise(function (resolve, reject) {

            connection.query('SELECT id_company FROM user WHERE id_User = ?', [req.session.user], function (error, company, fields) {
                connection.query('SELECT * FROM user WHERE id_company = ?', [company[0].id_company], function (error, result, fields) {


                    for (let j = 0; j < result.length; j++) {
                        console.log("imie z body:");
                        console.log(req.body.imie[i]);
                        console.log(" imie z bazy:");
                        console.log(result[j].imie);
                        if (req.body.imie[i].length > 1) {
                            if (req.body.imie[i] == result[j].imie && req.body.nazwisko[i] == result[j].nazwisko) {
                                console.log(" nazwisko z body:");
                                console.log(req.body.nazwisko[i]);
                                console.log("nazwisko z bazy:");
                                console.log(result[j].nazwisko);
                                resolve([1, company[0].id_company, result[j].id_User, null, null, null,i]);
                            }
                            else {
                                resolve([0, company[0].id_company, null, req.body.imie[i], req.body.nazwisko[i], req.body.stanowisko[i],i]);
                            }
                        }
                        else {
                            if (req.body.imie == result[j].imie && req.body.nazwisko == result[j].nazwisko) {
                                console.log(" nazwisko z body asda:");
                                console.log(req.body.nazwisko);
                                console.log("nazwisko z bazya asd:");
                                console.log(result[j].nazwisko);
                                resolve([1, company[0].id_company, result[j].id_User, null, null, null,i]);
                            }
                            else {
                                resolve([0, company[0].id_company, null, req.body.imie, req.body.nazwisko, req.body.stanowisko,i]);
                            }

                        }
                    }

                });
            });
        });


        szukanie
            .then(([dodano, company, us, imie, nazwisko, stanowisko, i]) => {
                console.log("dodano");
                console.log(dodano);
                console.log("company");
                console.log(company);
                console.log("us");
                console.log(stanowisko);
                console.log(i);

                if (dodano == 1) {
                    connection.query('INSERT INTO application (id_event, id_User, id_zgl, state, date, zw, rabat ) VALUES (?, ?, ?, ?, ?, ?, ?)', [even, us, req.session.user, state, date, zw, rabat], function (error, result, fields) {
                        connection.query('UPDATE event SET NoC=NoC+1 WHERE id_event = ?', [even], (error, event, fields) => {
                            console.log(even);
                            console.log(req.session.user);
                            console.log("Dodano starego");
                            console.log(req.body.nazwisko[i]);
                            return i;

                        });
                    });
                }


                if (dodano == 0) {
                    connection.query('INSERT INTO user( imie, nazwisko, stanowisko, id_company) VALUES (?, ?, ?, ?)', [imie, nazwisko, stanowisko, company], function (error, results, fields) {
                        connection.query('INSERT INTO application (id_event, id_User, id_zgl, state, date, zw, rabat) VALUES (?, ?, ?, ?, ?, ?, ?)', [even, results.insertId, req.session.user, state, date, zw, rabat], function (error, resulty, fields) {
                            connection.query('UPDATE event SET NoC=NoC+1 WHERE id_event = ?', [even], (error, event, fields) => {
                                console.log("Dodano nowego ");
                                console.log(req.body.nazwisko[i]);
                                return i;

                            });
                        });
                    });
                }

            }).then(() => {
                mylist(req, res);
            });


    }
   
}

//GET rezygnacja ze szkolenia 
function deleteapp(req, res) {
    let application = req.params.id;
    connection.query('SELECT application.id_event, user.id_company FROM application INNER JOIN user ON application.id_User = user.id_User WHERE application.id_application = ?', [application], (error, even, fields) => {
        
        
            
        connection.query(' DELETE FROM application WHERE id_application = ?', [application], (error, event, fields) => {
            connection.query('SELECT application.id_application FROM application INNER JOIN user ON application.id_User = user.id_User WHERE user.id_company = ? AND application.id_event=?', [even[0].id_company, even[0].id_event], (error, resul, fields) => {
                connection.query('UPDATE event SET NoC=NoC-1 WHERE id_event = ?', [even[0].id_event], (error, event, fields) => {
                    if (resul.length > 1) {

                        res.redirect('/showapplication:'+resul[0].id_application);
                    } else {
                        mylist(req, res, '');
                    }
                    
                });
            });
        });
    });

}

//GET szczegoly zamowienia szkolenia
function details(req, res) {
    let application = req.params.id;
    console.log("applicatiom:" + application);
    connection.query('SELECT id_event FROM application WHERE id_application = ?', [application], (error, even, fields) => {
        connection.query('SELECT user.id_company FROM user WHERE user.id_User = ?', [req.session.user], (error, company, fields) => {
            console.log("company", company);
            connection.query('SELECT user.imie, user.nazwisko, user.stanowisko, application.id_application,application.zgloszenie FROM application INNER JOIN user ON application.id_User = user.id_user WHERE application.id_event = ? AND user.id_company = ?', [even[0].id_event, company[0].id_company], (error, results, fields) => {
                
                res.locals.detailstab = results;
                console.log("results", results);
                connection.query('SELECT event.topic, trainer.Name, trainer.description, event.city, event.date, event.hotel, event.price, event.id_event, event.descriptions FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.id_event= ? ', [even[0].id_event], function (error, event, fields) {
                    event[0].date = changedate(event[0].date);
                    res.locals.eventtab = event
                    res.render('pages/client/details.ejs', { req: req.session.user, detailstab: res.locals.detailstab, eventtab: res.locals.eventtab });
                });

            });

        });
    });
}

//GET generowanie zgloszenia
function zgloszenie(req, res) {
    let application = req.params.id;
    let companies;
    console.log("applicatiom:" + application);
    connection.query('SELECT id_event FROM application WHERE id_application = ?', [application], (error, even, fields) => {
        connection.query('SELECT * FROM user WHERE user.id_User = ?', [req.session.user], (error, company, fields) => {
            console.log("company" + req.query.company);
            if (req.query.company) {
                companies = req.query.company;
            }
            else {
                companies = company[0].id_company;
            }
            console.log("companies  :" + companies);
            connection.query('SELECT * FROM company WHERE company.id_company = ?', [companies], (error, compan, fields) => {
                res.locals.company = compan;
                connection.query('SELECT user.imie, user.nazwisko, user.stanowisko, application.rabat, application.zw FROM application INNER JOIN user ON application.id_User = user.id_user WHERE application.id_event = ? AND user.id_company = ?', [even[0].id_event, companies], (error, results, fields) => {

                    res.locals.detailstab = results;
                    console.log("results", results);
                    connection.query('SELECT event.topic, event.city, event.date, event.hotel, event.price FROM event WHERE event.id_event= ? ', [even[0].id_event], function (error, event, fields) {
                        event[0].date = changedate(event[0].date);
                        res.locals.eventtab = event;
                        console.log("event", event);
                        async function dopdf(ile) {
                            try {
                                console.log("weszlo");
                                let zgl;
                                if (ile < 6) {
                                zgl = await ejs.renderFile(path.join(__dirname, '../views/pages/', "zgloszenie.ejs"), { events: res.locals.eventtab, result: res.locals.detailstab, company: res.locals.company });
                                }
                                else {
                                zgl = await ejs.renderFile(path.join(__dirname, '../views/pages/', "zgloszenie2.ejs"), { events: res.locals.eventtab, result: res.locals.detailstab, company: res.locals.company });
                                }
                                const browser = await puppeteer.launch();
                                const page = await browser.newPage();
                                await page.setContent(zgl);
                                await page.emulateMedia('screen');
                                await page.pdf({
                                    path: './zgl.pdf',
                                    format: 'A4',
                                    border: '10mm',
                                    printBackground: true
                                });
                                console.log("zrobione");
                                await browser.close();
                                await res.download('./zgl.pdf');
                               
                                

                            }
                            catch{
                                console.log("blad");
                            }
                        };
                        let d = results.length;
                        dopdf(d);
                    });




                });
            });
        });

    });
}


function addzgloszenie(req, res) {
    let application = req.params.id;
    let zgloszenie = '/zgloszenie/' + req.file.filename;
    connection.query('SELECT application.id_event, user.id_company FROM application INNER JOIN user ON application.id_User = user.id_User WHERE application.id_application = ?', [application], (error, even, fields) => {

        connection.query('SELECT application.id_application FROM application INNER JOIN user ON application.id_User = user.id_User WHERE user.id_company = ? AND application.id_event=?', [even[0].id_company, even[0].id_event], (error, resul, fields) => {
            for (let i = 0; i < resul.length; i++) {
                let app = resul[i].id_application;
                connection.query('UPDATE application SET zgloszenie = ? WHERE id_application= ?', [zgloszenie, app], (error, result, fields) => { });
            }
                res.redirect('back');
        });
    });
}



 /*
 * MANAGER
 */  

//POST logowanie
function loginAuthWork(req, res, url) {

    if (req.body.email == '') {

        res.render('pages/work/login', { req: req.session.user, noInput: true });

    } else {
        loginAuthQueryWork(req, res, url);
    }
}
function loginAuthQueryWork(req, res, url) {

    connection.query('SELECT * FROM employee WHERE email = ?', [req.body.email], function (error, result, fields) {
        console.log(result);

        if (result.length == 0 || error) {
            res.render('pages/work/login', { req: req.session.user, error: true, email: true, password: null, admin: false });
        }
        else {

            bcrypt.compare(req.body.password, result[0].password, function (err, results) {
                console.log("good");

                if (results == true) {
                    console.log("1");
                    req.session.user = result[0].id_employee;

                    console.log("2");
                    req.session.admin = true;
                    console.log("3");
                    console.log(req.session.id);
                    console.log("4");
                    if (result[0].manager == 1) {
                        conferences(req, res, '');
                    }
                    else {
                        a

                    }
                }
                else {
                    console.log("bad");
                    res.render('pages/work/login', { req: req.session.user, error: true, password: true, email: null, admin: false });
                }
            });
        }
    });
}

//GET lista aktulanych szkolen w trakcie realizacji
function conferences(req, res) {
    var currentdate = mydate('date');
    connection.query('SELECT event.topic, trainer.Name, event.city, event.date, event.price, event.id_event, event.NoC, event.state, employee.name, employee.last_name FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer INNER JOIN employee ON event.id_employee = employee.id_employee WHERE event.date > ? ORDER BY event.date ASC ', [currentdate], function (error, result, fields) {

        for (let i = 0; i < result.length; i++) {
            result[i].date = changedate(result[i].date);
        }
        res.locals.tabresult = result;
        res.render('pages/work/manager/list', { req: req.session.id, tabresult: res.locals.tabresult, admin: true, last: false });
    });
}

//GET lista zrealizaowanych szkolen
function lastconferences(req, res) {
    var currentdate = mydate('date');
    connection.query('SELECT event.topic, trainer.Name, event.city, event.date, event.price, event.id_event, event.NoC, employee.name, employee.last_name FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer INNER JOIN employee ON event.id_employee = employee.id_employee WHERE event.state = 1 AND event.date < ? ORDER BY event.date ASC ', [currentdate], function (error, result, fields) {


        for (let i = 0; i < result.length; i++) {
            result[i].date = changedate(result[i].date);
        }

        res.locals.tabresult = result;

        res.render('pages/work/manager/list', { req: req.session.id, tabresult: res.locals.tabresult, admin: true, last: true });
    });
}

//GET informacje o szkoleniu
function eventdetails(req, res) {
    let event = req.params.id;
    console.log("applicatiom:" + event);

    connection.query('SELECT user.id_user, user.imie, user.nazwisko, user.stanowisko, company.id_company, company.name, company.name2, application.id_application, application.rabat, application.id_zgl, application.zgloszenie FROM application INNER JOIN user ON application.id_User = user.id_user LEFT JOIN company ON user.id_company = company.id_company WHERE application.id_event = ? ', [event], (error, results, fields) => {
       
            res.locals.detailstab = results;
            console.log("results", results);
            connection.query('SELECT event.topic, trainer.Name, trainer.description, event.city, event.date, event.hotel, event.price, event.id_event, event.descriptions, event.state FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.id_event= ? ', [event], function (error, event, fields) {
                event[0].date = changedate(event[0].date);
                res.locals.eventtab = event
                res.render('pages/work/manager/details.ejs', { req: req.session.user, detailstab: res.locals.detailstab, eventtab: res.locals.eventtab, admin: true });
            });

       
    });

}

//GET edytowanie szkolenia
function geteditevent(req, res) {
    let even = req.params.id;
    connection.query('SELECT event.topic, trainer.id_trainer, trainer.Name, event.descriptions, event.city, event.date, event.time, event.hotel, event.price, event.id_event, event.descriptions, event.id_employee, employee.name, employee.last_name FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer INNER JOIN employee ON event.id_employee = employee.id_employee WHERE event.id_event= ? ', [even], function (error, result, fields) {
        console.log(result);
        console.log("info oooo ");
        let date = result[0].date;
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        result[0].date = year + '-' + month + '-' + day;
        console.log(result[0].date);
        res.locals.edit = result;
        console.log("info oooo jjjjj ");
        connection.query('SELECT id_trainer, Name FROM trainer', [], (error, trainer, fields) => {
            connection.query('SELECT id_employee,name,last_name FROM employee', [], (error, employee, fields) => {
                res.locals.trainer = trainer;
                res.locals.employee = employee;
                res.render('pages/work/manager/editevent.ejs', { req: req.session.user, edit: res.locals.edit, trainer: res.locals.trainer, employee: res.locals.employee, admin: true });
            })
        })
    });
}

//POST wprowadzenie zmian w szkoleniu
function posteditevent(req, res)
{
    let even = req.params.id;
    var parts = req.body.data.split('-');
    var mydate = new Date(parts[0], parts[1] - 1, parts[2]);
    console.log(mydate);
    let trainer = req.body.trainer * 1;
    let employee = req.body.employee * 1;
    console.log(trainer);
    console.log(employee);

    if (req.file) {
        let program = '/programs/' + req.file.filename;


        console.log('req.body >>>', req.file.filename);
        console.log('req.body >>>', req.file.orginalname);
        connection.query('UPDATE event SET program = ? WHERE id_event= ?', [program, even], (error, results, fields) => { });
    }


    connection.query('UPDATE event SET topic=?, date=?, city=?, hotel=?, time=?, descriptions=?, id_trainer=?, id_employee=?, price=? WHERE id_event=?', [req.body.topic, mydate, req.body.city, req.body.hotel, req.body.time, req.body.descriptions, trainer, employee, req.body.price, even], (error, result, fields) => { });
    console.log(req.body);
    conferences(req, res, '');
}

// GET formularz nowego szkolenia
function newevent(req, res) {
    connection.query('SELECT id_trainer, Name FROM trainer', [], (error, trainer, fields) => {
        connection.query('SELECT id_employee,name,last_name FROM employee', [], (error, employee, fields) =>{
            res.locals.trainer = trainer;
            res.locals.employee = employee;
            res.render('pages/work/manager/newevent', { req: req.session.id, trainer: res.locals.trainer, employee: res.locals.employee,  admin: true });
        })
    })

}

//POST dodanie nowego szkolenia
function addnewevent(req, res) {
    var parts = req.body.data.split('-'); 
    var mydate = new Date(parts[0], parts[1] - 1, parts[2]);
    console.log(mydate);
    let trainer = req.body.trainer * 1 ;
    let employee = req.body.employee * 1;
    console.log(trainer);
    console.log(employee);


    let program = '/programs/' + req.file.filename;
 

    console.log('req.body >>>', req.file.filename);
    console.log('req.body >>>', req.file.orginalname);


 connection.query('INSERT INTO event(topic, date, city, hotel, time, descriptions, id_trainer, id_employee, price, state,NoC, NoI, program)  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [req.body.topic, mydate, req.body.city, req.body.hotel, req.body.time, req.body.descriptions, trainer, employee, req.body.price, 1, 0, 0, program], (error, result, fields) => { });
    console.log(req.body);
    conferences(req, res, '');
}

function addnewuser(req, res) {
    let even;
    let comp;
    console.log(req.query.event);
    console.log(req.query.company);
    var szukam_event = new Promise(function (resolve, reject) {
        if (req.query.event) {
            even = req.query.event;
            connection.query('SELECT topic, id_event, date FROM event WHERE id_event=? ', [even], function (error, event, fields) {
                event[0].date = changedate(event[0].date);
                res.locals.event = event;
                resolve(event);
            });
        }
        else {
            connection.query('SELECT topic, id_event, date FROM event ', [], function (error, event, fields) {
                console.log(event);
                for (let i = 0; i < event.length; i++) {
                    event[i].date = changedate(event[i].date);
                }
                res.locals.event = event;
                resolve(event);
            });

        }

    });
    var szukam_company = new Promise((resolve, reject) => {
        if (req.query.company) {
            comp = req.query.company;
            connection.query('SELECT id_company, name, name2 FROM company WHERE id_company = ? ', [comp], function (error, company, fields) {
                res.locals.company = company;
                resolve(company);
            });
        }
        else {
            connection.query('SELECT id_company,name, name2 FROM company GROUP BY id_company DESC ', [], function (error, company, fields) {
                console.log(company);
                res.locals.company = company;
                resolve(company);
            });
        }
    });
    

    Promise.all([szukam_event, szukam_company]).then((values) => {
        console.log("values");
        console.log(values[0]);
        console.log(values[1].length);
        //console.log(res.locals.company);
       // console.log(res.locals.event);
        res.render('pages/work/manager/addnewuser', { req: req.session.user, event: values[0], company: values[1], admin:true });
    });
}

function postaddnewuser(req, res) {
    let state = 1;
    let date = mydate('full');
    let zw = null;
    let rabat = req.body.rabat;
    let even = req.body.event;
    console.log(req.body);
    console.log(req.body.check[0][1]);
    if (req.body.check[0][1] == 1) {
        zw = 1;
        console.log("zw" + zw);
    }
    console.log("ilosc osób:" + req.body.imie.length);
    var num = req.body.imie.length;
    if (req.body.imie.length > 1 && req.body.imie[0].length < 2) {
        num = 1;
        console.log("num" + num);
    }
    
    for (let i = 0; i < num; i++) {

        var szukanie = new Promise(function (resolve, reject) {

            let compan = req.body.company;
            console.log("compan = " + compan);
                connection.query('SELECT * FROM user WHERE id_company = ?', [compan], function (error, result, fields) {
                    console.log("resultion");
                    console.log(result);

                    if (result.length > 0) {
                        for (let j = 0; j < result.length; j++) {
                            console.log("imie z body:");
                            console.log(req.body.imie[i]);
                            console.log(" imie z bazy:");
                            console.log(result[j].imie);
                            if (req.body.imie[i].length > 1) {
                                if (req.body.imie[i] == result[j].imie && req.body.nazwisko[i] == result[j].nazwisko) {
                                    console.log(" nazwisko z body:");
                                    console.log(req.body.nazwisko[i]);
                                    console.log("nazwisko z bazy:");
                                    console.log(result[j].nazwisko);
                                    resolve([1, compan, result[j].id_User, null, null, null, i]);
                                }
                                else {
                                    resolve([0, compan, null, req.body.imie[i], req.body.nazwisko[i], req.body.stanowisko[i],i]);
                                }
                            }
                            else {
                                if (req.body.imie == result[j].imie && req.body.nazwisko == result[j].nazwisko) {
                                    console.log(" nazwisko z body asda:");
                                    console.log(req.body.nazwisko);
                                    console.log("nazwisko z bazya asd:");
                                    console.log(result[j].nazwisko);
                                    resolve([1, compan, result[j].id_User, null, null, null, i]);
                                }
                                else {
                                    resolve([0, compan, null, req.body.imie, req.body.nazwisko, req.body.stanowisko, i]);
                                }

                            }
                        }
                    }
                    else {
                        if (req.body.imie[i].length > 1) {
                            console.log("jest ok 1");
                            resolve([0, compan, null, req.body.imie[i], req.body.nazwisko[i], req.body.stanowisko[i], i]);
                        }
                        else {
                            console.log("jest ok 2");
                            resolve([0, compan, null, req.body.imie, req.body.nazwisko, req.body.stanowisko, i]);
                        }
                    }

                });
           
        });

  
        szukanie
            .then(([dodano, company, us, imie, nazwisko, stanowisko,i]) => {
                console.log("dodano");
                console.log(dodano);
                console.log("company");
                console.log(company);
                console.log("us");
                console.log(stanowisko);
                if (dodano == 1) {
                    connection.query('INSERT INTO application (id_event, id_User, state, date, zw, rabat ) VALUES (?, ?, ?, ?, ?, ?)', [even, us,  state, date, zw, rabat], function (error, result, fields) {
                        connection.query('UPDATE event SET NoC=NoC+1 WHERE id_event = ?', [even], (error, event, fields) => {
                            console.log(even);
                            console.log(req.session.user);
                            console.log("Dodano starego");
                            console.log(req.body.nazwisko[i]);
                            if (i >= num - 1) {
                                res.redirect('/eventdetails:' + even);
                            }

                        });
                    });
                }


                if (dodano == 0) {
                    connection.query('INSERT INTO user( imie, nazwisko, stanowisko, id_company) VALUES (?, ?, ?, ?)', [imie, nazwisko, stanowisko, company], function (error, results, fields) {
                        connection.query('INSERT INTO application (id_event, id_User, state, date, zw, rabat) VALUES (?, ?, ?, ?, ?, ?)', [even, results.insertId, state, date, zw, rabat], function (error, resulty, fields) {
                            connection.query('UPDATE event SET NoC=NoC+1 WHERE id_event = ?', [even], (error, event, fields) => {
                                console.log("Dodano nowego ");
                                console.log(req.body.nazwisko[i]);
                                if (i >= num - 1) {
                                    res.redirect('/eventdetails:' + even);
                                }

                            });
                        });
                    });
                }

            });
    
    }
    
}


function addnewcomapny(req, res) {
    connection.query('INSERT INTO company (NIP, name, adres, name2, adres2, emailfv) VALUES (?, ?, ?, ?, ?, ?) ', [req.body.NIP, req.body.nazwa, req.body.adres, req.body.nazwa2, req.body.adres2, req.body.emailfv], function (error, results, fields) {
        res.redirect('back');
    });
}


//GET informacje o uzytkowaniku 
function showuser(req, res) {
    let user = req.params.id;
    connection.query('SELECT * FROM user INNER JOIN company ON user.id_company = company.id_company WHERE id_User = ?', [user], function (error, result, fields) {
        connection.query('SELECT id_company, name, name2 FROM company GROUP BY id_company DESC', [], function (error, company, fields) {
            res.locals.company = company;
            res.locals.account = result;
            res.render('pages/work/manager/user.ejs', { req: req.session.user, account: res.locals.account, company: res.locals.company, update: false, admin: true });
        });
    });
}

//GET informacje o instytucji/firmie
function showcompany(req, res) {
    let company = req.params.id;
    connection.query('SELECT * FROM user INNER JOIN company ON user.id_company = company.id_company WHERE company.id_company = ? GROUP BY user.id_User DESC', [company], function (error, result, fields) {
        res.locals.account = result;
        res.render('pages/work/manager/company.ejs', { req: req.session.user, account: res.locals.account, update: false, admin: true });
    });
}

//GET informacje o zgloszeniu
function showapplication(req, res) {
    let application = req.params.id;
    console.log("application:" + application);


    connection.query('SELECT user.id_company, application.id_event, application.id_zgl FROM user INNER JOIN application ON user.id_User = application.id_User WHERE application.id_application = ?', [application], (error, company, fields) => {
        console.log("company", company);
        connection.query('SELECT company.id_company, company.name,company.name2 FROM  company  WHERE id_company= ?', [company[0].id_company], (error, com, fields) => {
            res.locals.zgl = com;
        connection.query('SELECT user.imie, user.nazwisko, user.id_User, company.id_company, company.name,company.name2 FROM user INNER JOIN company ON user.id_company = company.id_company WHERE id_User= ?', [company[0].id_zgl], (error, zgl, fields) => {
                res.locals.company = com;
                 connection.query('SELECT user.id_User, user.imie, user.nazwisko, user.stanowisko, application.id_application, application.date, application.rabat, application.zgloszenie FROM application INNER JOIN user ON application.id_User = user.id_user WHERE application.id_event = ? AND user.id_company = ?', [company[0].id_event, company[0].id_company], (error, results, fields) => {
                    results[0].date = changedate(results[0].date);
                     res.locals.detailstab = results;
                     console.log("results", results);
                     connection.query('SELECT event.topic, trainer.Name, trainer.description, event.city, event.date, event.hotel, event.price, event.id_event, event.descriptions FROM event INNER JOIN trainer ON event.id_trainer = trainer.id_trainer WHERE event.id_event= ? ', [company[0].id_event], function (error, event, fields) {
                             event[0].date = changedate(event[0].date);
                            res.locals.eventtab = event
                         res.render('pages/work/manager/application.ejs', { req: req.session.user, detailstab: res.locals.detailstab, eventtab: res.locals.eventtab, zgl: res.locals.zgl, company: res.locals.company,   admin:true });

                     });
                 });
            });
        });
    });
}

function showzgloszenie(req, res) {

    
    console.log(req.params.id)
    connection.query('SELECT zgloszenie FROM application WHERE id_application = ?', [req.params.id], (error, result, fields) => {
        let fil = path.join(__dirname, '/..', result[0].zgloszenie);
        fs.readFile(fil, function (err, data) {
            res.contentType("text/plain");
            res.send(data);
        });
       /* console.log(result[0].program);
        console.log(path.join(__dirname, '/..', result[0].program));
        res.download(path.join(__dirname, '/..', result[0].program));*/
    });
}

function showprogram(req, res) {


    console.log(req.params.id)
    connection.query('SELECT program FROM event WHERE id_event = ?', [req.params.id], (error, result, fields) => {
        let fil = path.join(__dirname, '/..', result[0].program);
        fs.readFile(fil, function (err, data) {
            res.contentType("application/pdf");
            res.send(data);
        });
        /* console.log(result[0].program);
         console.log(path.join(__dirname, '/..', result[0].program));
         res.download(path.join(__dirname, '/..', result[0].program));*/
    });
}

function finishfv(req, res) {
    let event = req.params.id;
    connection.query('SELECT company.id_company, company.name, company.name2 FROM application INNER JOIN user ON application.id_User = user.id_User INNER JOIN company ON user.id_company = company.id_company WHERE application.id_event= ? GROUP BY company.id_company ', [event], (error, company, fields) => {
        connection.query('SELECT price FROM event WHERE id_event =? ', [event], (error, price, fields) => {

        
        let com = [];
        for (let i =0 ; i < company.length; i++) {
            connection.query('SELECT application.id_event, company.name, company.name2, COUNT(application.id_application) AS ile ,SUM(application.rabat) AS rabat FROM application INNER JOIN user ON application.id_User = user.id_User INNER JOIN company ON user.id_company = company.id_company WHERE application.id_event= ? AND company.id_company=? ', [event, company[i].id_company], (error, result, fields) => {
                console.log(result);
                com[i] = new Array();
                com[i][0] = company[i].name;
                com[i][1] = company[i].name2;
                com[i][2] = result[0].ile;
                com[i][3] = price[0].price;
                com[i][4] = result[0].rabat;
                com[i][5] = price[0].price * result[0].ile - result[0].rabat;
                com[i][6] = result[0].id_event;

                console.log(com[i][3]);
               // com[i][2] = result.['COUNT(application.id_application)'];

                if (i == company.length - 1) {
                    console.log(com);
                    res.render('pages/work/manager/finishfv', { req: req.session.user, company: com, admin: true });

                }
            });
            
        
        }
        });
    });
}
function finishcert(req, res) {
    let event = req.params.id;
    connection.query('SELECT * FROM application INNER JOIN user ON application.id_User = user.id_User INNER JOIN company ON user.id_company = company.id_company WHERE application.id_event= ? ORDER BY user.nazwisko', [event], (error, users, fields) => {
        res.locals.users = users;
        console.log(users);
        res.render('pages/work/manager/finishcert', { req: req.session.user, users: res.locals.users, admin: true });
    });
}
function finish(req, res) {
    let event = req.params.id;
    connection.query('SELECT * FROM application INNER JOIN user ON application.id_User = user.id_User INNER JOIN company ON user.id_company = company.id_company WHERE application.id_event= ? ORDER BY user.nazwisko', [event], (error, users, fields) => {
        res.locals.users = users;
        console.log(users);
        res.render('pages/work/manager/finish', { req: req.session.user, users: res.locals.users, admin: true });
    });
}

function print(req, res) {
    let event = req.params.id;
    connection.query('SELECT * FROM application INNER JOIN user ON application.id_User = user.id_User INNER JOIN company ON user.id_company = company.id_company WHERE application.id_event= ? ORDER BY user.nazwisko', [event], (error, users, fields) => {
        res.locals.result = users;
        connection.query('SELECT event.topic, event.city, event.date FROM event WHERE event.id_event= ? ', [event], function (error, event, fields) {
            event[0].date = changedate(event[0].date);
            res.locals.eventtab = event;
        async function dopdf(ile) {
            try {
                var tabil = [];
                console.log("weszlo");
                if (ile > 10) { tabil[0] = 10; }
                else {tabil[0] = ile;}
                if (ile > 30) { tabil[1] = 30; }
                else { tabil[1] = ile; }
                if (ile > 50) { tabil[2] = 50; }
                else { tabil[2] = ile; }
                if (ile > 70) { tabil[3] = 70; }
                else { tabil[3] = ile; }

                    lista = await ejs.renderFile(path.join(__dirname, '../views/pages/', "lista.ejs"), { events: res.locals.eventtab, result: res.locals.result, ile: tabil });
               
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.setContent(lista);
                await page.setContent(lista);
                await page.emulateMedia('screen');
                await page.pdf({
                    path: './lista.pdf',
                    format: 'A4',
                    border: '10mm',
                    printBackground: true,
                    landscape: true
                });
                console.log("zrobione");
                await browser.close();
                await res.download('./lista.pdf');



            }
            catch{
                console.log("blad");
            }
        };
            let d = users.length;
        dopdf(d);
    });
    });




}

function printcertall(req, res) {
    let event = req.params.id;
    connection.query('SELECT user.imie, user.nazwisko FROM application INNER JOIN user ON application.id_User = user.id_User WHERE application.id_event= ? ORDER BY user.nazwisko', [event], (error, users, fields) => {
        res.locals.result = users;
        connection.query('SELECT event.topic, event.city, event.date, trainer.name FROM event INNER JOIN trainer ON event.id_trainer=trainer.id_trainer WHERE event.id_event= ? ', [event], function (error, event, fields) {
            event[0].date = changedate(event[0].date);
            res.locals.eventtab = event;
            async function dopdf() {
                try {
                    console.log("weszlo");
                     certall = await ejs.renderFile(path.join(__dirname, '../views/pages/', "cert.ejs"), { events: res.locals.eventtab, result: res.locals.result });

                    const browser = await puppeteer.launch();
                    const page = await browser.newPage();
                    await page.setContent(certall);
                    await page.emulateMedia('screen');
                    await page.pdf({
                        path: './certall.pdf',
                        format: 'A5',
                        border: '10mm',
                        printBackground: true,
                        
                    });
                    console.log("zrobione");
                    await browser.close();
                    await res.download('./certall.pdf');



                }
                catch{
                    console.log("blad");
                }
            };
            dopdf();
        });
    });




}

function printcert(req, res) {
    let event = req.params.id;
    let user = req.query.user;
    console.log(user);
    connection.query('SELECT imie, nazwisko FROM user WHERE id_User= ?', [user], (error, users, fields) => {
        res.locals.result = users;
        connection.query('SELECT event.topic, event.city, event.date, trainer.name FROM event INNER JOIN trainer ON event.id_trainer=trainer.id_trainer WHERE event.id_event= ? ', [event], function (error, event, fields) {
            event[0].date = changedate(event[0].date);
            res.locals.eventtab = event;
            async function dopdf() {
                try {
                    console.log("weszlo");
                    certall = await ejs.renderFile(path.join(__dirname, '../views/pages/', "cert.ejs"), { events: res.locals.eventtab, result: res.locals.result });

                    const browser = await puppeteer.launch();
                    const page = await browser.newPage();
                    await page.setContent(certall);
                    await page.emulateMedia('screen');
                    await page.pdf({
                        path: './cert.pdf',
                        format: 'A5',
                        border: '10mm',
                        printBackground: true,

                    });
                    console.log("zrobione");
                    await browser.close();
                    await res.download('./cert.pdf');



                }
                catch{
                    console.log("blad");
                }
            };
            dopdf();
        });
    });




}


function num(id_event){
    return new Promise((resolve, reject) => {
          connection.query('SELECT COUNT(id_application) AS ile FROM application WHERE id_event = ?', [id_event], (error, result, fields) => {
           console.log(result[0].ile);
            
           resolve(result[0].ile);
        });
    });
}

function changedate(data) {
    let date = data;
    let year = date.getFullYear();
    let month = date.getMonth()+1;
    let day = date.getDate();
    return day + '.' + month + '.' + year;
}




module.exports = router;










