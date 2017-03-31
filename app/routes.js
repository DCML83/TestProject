var User         = require('../app/model/user').User;
var db = require('../config/database.js');
var friends = require("mongoose-friends");
var Status = require("mongoose-friends").Status;
var Post  = require('../app/model/posts').Post;
var Group = require('../app/model/groups').Group;
var lostFound = require('../app/model/lostFound').lostFound;
var moment = require('moment');
var multer = require('multer');
var upload = multer({ dest:__dirname + '/public/upload/temp' });
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require("nodemailer");
var md5 = require("blueimp-md5");
var path = require('path');
var rootpath = path.dirname(require.main.filename);
module.exports = function(app, server, passport) {
	var io = require('socket.io')(server);
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
		res.render('index.ejs',{ message: req.flash('signupMessage') }); // load the index.ejs file
	});

	// app.get('/signup', function(req,res){
	//
	// 	//render the page and pass in any flash data if it exists
	// 	res.render('signup.ejs', { message: req.flash('signupMessage') });
	// });

	app.get('/lostandfound', isLoggedIn, function(req,res){

		lostFound.find({}, function(err, docs){
		 res.render('lostFound.ejs',{
				'postlist' : docs,
				user : req.user,
				// moment : moment(), // get the user out of session and pass to template
				//link:"https//"+req.get('host')+"/addFriend?id="
			});
		});
	});

	app.get('/group', isLoggedIn, function(req,res, done){
				// ids = req.user.group.map(function(id) { return ObjectId(id); });
				Group.find({'_id': {$in: req.user.group}}, function(err,groups){

					var property = [];
					groups.forEach(function(gg){
					console.log(gg);
					var gp = {_id:gg._id,name : gg.name, image: gg.image};
					property.push(gp);
			});
			res.render('Groups.ejs',{
				user:req.user,
				groups: property,
			});
		});
	});
app.get('/group/:id', isLoggedIn, function(req, res){
	Group.findOne({'_id':req.params.id}, function(err, g){
			console.log(g);
			var pl=[];
			res.render('Group-profile.ejs',{
					user:req.user,
					group:g,
					postlist:pl,
			});
	});
	});

	app.post('/createGroup', isLoggedIn, function(req,res,done){
		Group.find({'name':req.body.name}, function(err, group){
			if (group){
				console.log('group already exists')
			}
			var newGroup = new Group();
			newGroup.owner= req.user._id;
			newGroup.name = req.body.name;
			newGroup.description = req.body.description;
			newGroup.members = req.user._id;
			newGroup.type = req.body.type;
			newGroup.save(function(error) {
					if (!error) {
						User.findOne({'_id':req.user._id},function(err, user){
							if (!err){
								user.group.push(newGroup._id);
								user.save(function(error){
									return done(null, user);
								});
							}
						});

						 res.redirect(req.get('referer'));
						 return done(null, newGroup);
					 }
					else{
						console.log(error)
					}
				});
		});

	});
	var type = upload.single('picture');
	app.post('/lostfoundpost', type, isLoggedIn, function(req,res,done){
		var tmp_path = req.file.path;
 		var mimetype = req.file.mimetype.split("/");
		var extension = mimetype[1];
		var name  = md5(req.file.orignalname);
		destination ='upload/lostFound/' + name+"."+extension;
  	var target_path = rootpath + '/public/'+destination;
		var src = fs.createReadStream(tmp_path);
		var dest = fs.createWriteStream(target_path);
		src.pipe(dest);
		src.on('end', function() {
		var newlostFound = new lostFound();
		newlostFound.postby = req.user._id;
		newlostFound.body = req.body.message;
		newlostFound.date = moment().format();
		newlostFound.location = req.location;
		newlostFound.picture = destination;
		newlostFound.contact.email = req.body.email;
		newlostFound.contact.phone = req.body.phone;
		newlostFound.save(function(error) {
			if (!error) {
				 res.redirect(req.get('referer'));
				 return done(null, lostFound);
			 }
			else{
				console.log(error)
			}
		});
	});
	src.on('error', function(err) { console.log(err); });

});

	// process the signup form
	// app.post('/signup', do all our passport stuff here);


	// profile section

	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this ( the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req,res){
		link ="http://"+req.get('host');
		Post.find({postto: req.user._id}, function(err, docs){
			docs.reverse();
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
		User.findOne({'local.email':req.body.email}, function(err, u){
		newPost(req.user._id, u._id, req.body.message,req.body.visibility,req,res);
	});
});
app.post('/gpost', isLoggedIn, function(req,res, done){
	newPost(req.user._id, req.body.group_id, req.body.message," ",req,res);
});
	// app.post('/comment',function(req))

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
			  res.redirect("/profile");}
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
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/', // redirect back to the signup page if there is an error
		failureFlash: true // allow flash messages
	}));

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	app.get('/chatroom', isLoggedIn,function(req, res){
	  res.render('chatroom.ejs',{
			user: req.user,
		});
	});
	//start connenction for  socket io
	io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
	socket.on('profile_comment',function(info){
		User.findOne({'local.email':info.user_id}, function(err, user){
			Post.findById(info.post_id,function(err, post){
				var post_comment = {
				text :info.comment,
				date : moment().format(),
				postby :user,};

				post.comments.push(post_comment);
				post.save(function(err){
					if(err){
						console.log("how this possible?")
					}
				});


		});
	});
		io.emit('profile_comment', info.comment);
});
});
};

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

function generateHash(str) {
	return bcrypt.hashSync(str, bcrypt.genSaltSync(8), null);
}

function newPost(id, tid, m, v, req, res){
	var newPost = new Post();
	newPost.postby = id;
	newPost.postto = tid
	newPost.body = m;
	newPost.date = moment().format();
	newPost.visibility = v;
	newPost.save(function(error) {
		if (!error) {
		res.redirect(req.get('referer'));
			//  return done(null, newPost);
		 }
		else{
			console.log(error)
		}
	});
}
