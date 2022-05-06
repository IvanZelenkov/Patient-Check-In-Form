const express = require('express');
const path = require('path');
const session = require('express-session');
const hbs = require('express-handlebars');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy	= require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {v4} = require('uuid');
const User = require('./public/models/User.js');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

let PATIENTS = [
    {id: v4(), patientID: '4994741', name: 'Ivan', date: '05/07/2022', phoneNumber: '5041432345'}
];

// Connect to MongoDB
mongoose.connect(
	`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.m7nwi.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, 
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

// Middleware
app.use(session({
	secret: "topsecret", 	// the secret is used to hash the session

	resave: false, 			// for every request to the server, it reset the session cookie

	saveUninitialized: true // the session will be stored in storage every time for the request. 
							// It will not depend on the modification of request.session
}));
app.use(express.urlencoded({ extended: false })); // body parser for html post form
app.use(express.json()); // parses incoming JSON requests and puts the parsed data in the request

// Passport.js
app.use(passport.initialize()); // initialize passport
app.use(passport.session()); // it authenticates the session

// serializeUser determines which data of the user object should be stored in the session
passport.serializeUser(function (user, done) {
	done(null, user.id);
});

// deserializeUser gets an id from the cookie, which is then used in callback to get user info
passport.deserializeUser(function (id, done) {
	User.findById(id, function (error, user) {
		done(error, user);
	});
});

// local authentication strategy authenticates users using a username and password.
passport.use(new localStrategy(function (username, password, done) {
	// done is used to tell Passport whether we succeeded or not
	User.findOne({ username: username }, function (error, user) {
		if (error) 
			return done(error);
		if (!user) 
			return done(null, false);

		bcrypt.compare(password, user.password, function (error, response) {
			if (error) 
				return done(error);
			if (response === false) 
				return done(null, false);
			
			return done(null, user);
		});
	});
}));

/* Check if the user is logged in */
function isLoggedIn(request, response, next) {
	if (request.isAuthenticated()) 
		return next();
	response.redirect('/login');
}

/* Check if the user is logged out */
function isLoggedOut(request, response, next) {
	if (!request.isAuthenticated()) 
		return next();
	response.redirect('/');
}

// GET - display home page if the user is logged in
app.get('/', isLoggedIn, (request, response) => {
	response.sendFile("/public/index.html", { root: __dirname });
});

// GET - display login page if the user is not logged in
app.get('/login', isLoggedOut, (request, response) => {
	response.sendFile('/public/login.html', { root: __dirname });
});

// POST - authenticate user rand redirect to one of the pages
app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login?error=true'
}));

// GET - display logout page 
app.get('/logout', function (request, response) {
	request.logout();
	response.redirect('/');
});

// GET - set up an admin user
app.get('/setup', async (request, response) => {
	const exists = await User.exists({ username: "admin" });

	if (exists) {
		response.redirect('/login');
		return;
	}

	bcrypt.genSalt(10, function (error, salt) {
		if (error) 
			return next(error);

		bcrypt.hash("777", salt, function (error, hash) {
			if (error) 
				return next(error);
			
			const newAdmin = new User({
				username: "admin",
				password: hash
			});

			newAdmin.save();

			response.redirect('/login');
		});
	});
});

// GET patients
app.get('/api/patients', (request, response) => {
    setTimeout(() => {
        response.status(200).json(PATIENTS);
    }, 1000);
});

// POST patient
app.post('/api/patients', (request, response) => {
    const patient = {...request.body, id: v4(), marked: false};
    PATIENTS.push(patient);
    response.status(201).json(patient);
})

// DELETE patient
app.delete('/api/patients/:id', (request, response) => {
    PATIENTS = PATIENTS.filter(c => c.id !== request.params.id);
    response.status(200).json({message: 'Patient removed'});
})

// PUT patient
app.put('/api/patients/:id', (request, response) => {
    const idx = PATIENTS.findIndex(c => c.id === request.params.id);
    PATIENTS[idx] = request.body;
    response.json(PATIENTS[idx]);
})

/* Static files are files that clients download as they are from the server.
Create a new directory, public. Express, by default does not allow you to serve static files.
You need to enable it using the following built-in middleware. */
app.use(express.static(path.resolve(__dirname, 'public')));

app.get('*', (request, response) => {
    response.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(port);