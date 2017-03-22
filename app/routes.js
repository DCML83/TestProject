var User         = require('../app/model/user').User;
var db = require('../config/database.js');
var friends = require("mongoose-friends");
var Status = require("mongoose-friends").Status;
var Post  = require('../app/model/posts').Post
var nodemailer = require("nodemailer");
var moment = require('moment');

module.exports = function(app, passport) {
	
	var smtpTransport = require("nodemailer-smtp-transport");
	var mailOptions,host,link;
	/* SMTP server */


	var smtpTransport = nodemailer.createTransport(smtpTransport({
		host: "smtp.gmail.com",
   	 	secureConnection : false,
   		port: 587,
		auth:{
				user: "multiculturalteam67@gmail.com",
				pass: "qwe12332"
			}
		}));

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

		Post.find({postto: req.user._id}, function(err, docs){
		 res.render('profile.ejs',{
				'postlist' : docs,
				user : req.user,
				// moment : moment(), // get the user out of session and pass to template
				//link:"https//"+req.get('host')+"/addFriend?id="
			});
		});	
	});


	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.post('/post', isLoggedIn, function(req,res, done){
		console.log(req.body.message);
		console.log(req.body.email);
		User.findOne({'local.email':req.body.email}, function(err, u){
		console.log('its here');
		var newPost = new Post();
		newPost.postby = req.user._id;
		newPost.postto = u._id
		newPost.body = req.body.message;
		newPost.date = moment().format('MMMM Do YYYY, h:mm:ss a');
		newPost.save(function(error) {
   		if (!error) {
			res.redirect(req.get('referer'));
    	   return done(null, newPost);
    }
		});});
	
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
	app.get('/profile-temp', isLoggedIn, function(req,res){

		if(req.user.local.active){
			res.render('profile.ejs', {
			});}
			else {
				res.render('profile-temp.ejs', {});
					host = req.get('host');
					link ="http://"+req.get('host')+"/verify?id="+req.user._id;
					mailOptions ={
						from:"multiculturalteam67@gmail.com",
					    to :req.user.local.email,
					    subject:"Please confirm your Email Account",
					    html:"Hello, <br> Please Click on the link to verify your email. <br><a href ="+link+">Click here to verify</a>"
					  }
					  console.log(mailOptions);
					  smtpTransport.sendMail(mailOptions,function(error, resoonse){
					    if (error){
					      console.log(error);
					    //   res.end("error");
					    }else{
					      console.log("Message sent: " + res.message);
					        // res.end("sent");
					    }
					  });
					}
				});


	app.get('/verify',function(req,res,done){
	console.log(req.protocol+":/"+req.get('host'));
    console.log("Domain is matched. Information is from Authentic email");
    	User.findById(req.query.id, function(err, user) {

			 if(err){
				 console.log(err)
				res.end("<h1>Request is from unknown source");
			 }

			user.local.active = true
			console.log("<h1>Email "+user.local.email+" is been Successfully verified");
			user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
			res.render('index.ejs', {});        
        });
	
});
	// process the signup from
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile-temp', // redirect to the secure profile section
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