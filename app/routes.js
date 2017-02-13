module.exports = function(app, passport) {
	var User = require('../app/model/user');	
	var nodemailer = require("nodemailer");
	var smtpTransport = require("nodemailer-smtp-transport")
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
		res.render('profile.ejs',{
			user: req.user // get the user out of session and pass to template
		});
	});


	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
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


	app.get('/verify',function(req,res){
	console.log(req.protocol+":/"+req.get('host'));
	if((req.protocol+"://"+req.get('host'))==("http://"+host))
	{
    console.log("Domain is matched. Information is from Authentic email");
    	User.findById(req.query.id, function(err, user) {
            done(err, user);
        });
		if(req.query.id==rand)
    	{
        console.log("email is verified");
        res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
   		 }
   		 else
   		 {
        console.log("email is not verified");
        res.end("<h1>Bad Request</h1>");
   		 }
	}
	else
	{
    res.end("<h1>Request is from unknown source");
	}
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
