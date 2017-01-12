// load all the modules needed

var LocalStrategy = require('passport-local').Strategy;

// load the user model

var User = require('../app/model/user.js');

//expose this function to our app using module.exports

module.exports = function(passport) {

		// passport session setup

		//required for persistent login sessions
		//passport needs ability to serialize and unserialize users out of session

		// used to serialize the user for the session
		passport.serializeUser(function(user,done){
			done(null, user.id);
		});

		// used to deserialize the user
		passport.deserializeUser (function(id, done){
			User.findById(id, function(err, user){
				done(err,user);
			});
		});


		// local signup

		passport.use('local-signup', new LocalStrategy({
			//by default, local strategy uses username and password, we will override with email
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done){
			//asynchronous
			// User.findOne wont fire unless data is sent back

			process.nextTick(function() {

			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exist
			User.findOne({ 'local.email' :email}, function(err, user) {
				// if there are any errors, return the error
				if(err)
					return done(err);
			

				// check to see if theres already a user with that email
				if(user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				} else {
					// if there is no user with that email
					//create new user

					var newUser = new User();

					// set the user's local credentials


					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);
					
					// save the user
					newUser.save(function(err) {
						if (err) 
							throw err;
						return done(null, newUser);
					});
				}
			});

			});
		}));

};
