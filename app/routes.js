var User         = require('../app/model/user').User;
var db = require('../config/database.js');

module.exports = function(app, passport) {
	//home page
	
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	//login
	
	// show the login form
	app.get('/login', function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	
	// process the login form
	// app.post('/login, do all our passport stuff here);

	//signup
	
	//show the signup form
	app.get('/signup', function(req,res){
		
		//render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});
	
	// process the signup form
	// app.post('/signup', do all our passport stuff here);


	// profile section
	
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this ( the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req,res){
		User.find({}, {}, function(e,docs){
			res.render('profile.ejs',{
				"userlist" : docs,
				user: req.user // get the user out of session and pass to template
			});
		});
	});
	
	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	
	app.get('/userlist', function(req, res) {
	    var db = req.db;
	    var collection = db.get('users');
	    collection.find({},{},function(e,docs){
	        res.render('userlist', {
	            "userlist" : docs
	        });
	    });
	});
	
	app.post('/addFriend', isLoggedIn, function(req, res) {
	    // Get our form values. These rely on the "name" attributes
		var db = req.db;
	    var userFriend = req.body.email;
	    var collection = db.get('users');
	    var thisUser = req.user;
	    var id = req.user._id;
	    var thisFriend = req.user.friends;
	    // Submit to the DB
//	    collection.insert({
//	    	friends:id,
//	    
//	    	function(err){
//		    	if (err){
//		    		console.log(err);
//		    			res.send("This was a problem");
//		    		
//		    	}
//		    	else{
//		    		res.redirect("/profile");
//		    	}
//		    }
//	    }); 
//	});
//	    
	    thisUser.update(
	    {
	    $addToSet:{
	        friends : userFriend
	    
	    }}, function (err, doc) {
	        if (err) {
	            // If it failed, return error
	            res.send("There was a problem adding the information to the database.");
	        }
	        else {
	            // And forward to success page
	            res.redirect("/profile");
	        }
	    });
	    });
//	    User.findByIdAndUpdate(
//	    id, 
//	    {$push: {friends : userFriend}},
//	    {new: true},
//	    function(err, model){
//	    	if (err){
//	    		console.log(err);
//	    			res.send("This was a problem");
//	    		
//	    	}
//	    	else{
//	    		res.redirect("/profile");
//	    	}
//	    });
//	    
//	});
	
	// process the signup from
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
};




function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();
	
	// if they aren't redirect them to the home page
	res.redirect('/');
}