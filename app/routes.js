var User = require('../app/model/user').User;
var db = require('../config/database.js');
var Post  = require('../app/model/posts').Post;
var Group = require('../app/model/groups').Group;
var lostFound = require('../app/model/lostFound').lostFound;
var Poll= require('../app/model/poll').Poll;
var moment = require('moment');
var multer = require('multer');
var upload = multer({ dest:__dirname + '/public/upload/temp' });
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require("nodemailer");
var md5 = require("blueimp-md5");
var path = require('path');
var friendsOfFriends = require('friends-of-friends');
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

		lostFound.find({}).populate('postby').exec(function(err, docs){
		 res.render('lostFound.ejs',{
				'postlist' : docs,
				user : req.user,
			});
		});
	});

	app.get('/group', isLoggedIn, function(req,res, done){
		Group.find({'_id': {$in: req.user.group}}, function(err,groups){
			var property = [];
			res.render('Groups.ejs',{
				user:req.user,
				groups: groups,
			});
		});
	});
app.get('/group/:id', isLoggedIn, function(req, res){
	Group.findOne({'_id':req.params.id}, function(err, g){
			var pl=[];
			res.render('Group-profile.ejs',{
					user:req.user,
					group:g,
					postlist:pl,
			});
	});
	});

	app.post('/createGroup', isLoggedIn, function(req,res,done){
		Group.findOne({'name':req.body.name}, function(err, group){
			if (group){
				console.log('group already exists')
			}
			else{
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
			}
		});

	});
	var type = upload.single('picture');
	app.post('/lostfoundpost', type, isLoggedIn, function(req,res,done){
		console.log(req.body);
		var tmp_path = req.file.path;
		var mimetype = req.file.mimetype.split("/");
		var extension = mimetype[1];
		var name  = md5(req.file.orignalname);
		destination ='upload/lostFound/' + name+"."+extension;
		var target_path = rootpath + '/public/'+destination;
		var src = fs.createReadStream(tmp_path);
		var dest = fs.createWriteStream(target_path);
		src.pipe(dest);
		src.on('end', function() {});
		src.on('error', function(err) { console.log(err); });
		var newlostFound = new lostFound();
		newlostFound.postby = req.user._id;
		newlostFound.body = req.body.message;
		newlostFound.date = moment().format();
		newlostFound.location=req.body.location;
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



// post route to handle user edit_profile_picture image
// it take user's id and query the record from database and update the path
// for the user image
app.post('/edit_profile_image', type, isLoggedIn, function(req,res){

});


	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this ( the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req,res){
		var currentUser = req.user;
		Post.find({postto: currentUser._id}).populate('postby').exec(function(err, posts){
				var collection = req.db.collection('friendships');
				collection.find({'requested':currentUser._id, 'status':'Pending'},function(err, request){
						var suggested =[];
						currentUser.getFriendsOfFriends(function(err, fof){
							var suggested = fof;
							if(fof.length == 0){
					 			User.find({'Major':currentUser.Major},function(err, users){suggested = users});
							}
							User.find({'_id':{$in:currentUser.friends}},function(err, friends){
								res.render('profile.ejs',{
									postlist: posts,
									user: req.user,
									owner:req.user,
									friends: friends,
									requestStatus: request,
									suggestedFriends: suggested,
								});
							});
						});
					});
				});
			});

			app.get('/profile/:id', isLoggedIn, function(req,res){
				var owner = req.params.id;
				User.findOne({'local.email': owner}, function (err, sid){

					var found = false;
					if (sid.visibility == "friends"){
						for ( j = 0; j < req.user.friends ; j++){
							if(req.user.friends[j] == sid._id){
								found = true;
								break
							}
						}
					}

					else if (sid.visibility == "me"){
						if (req.user == sid){
							found = true;
						}
					}

					else if ( sid.visibility = "everyone"){
						found = true;
					}

					if (found){
						Post.find({postto: sid}).populate('postby').exec(function(err, posts){
						var allowed_posts = [];
						posts.forEach(function(post){
							if (post.visibility == "me"){
								if (post.postto == req.user){
										allowed_posts.push(post);
								}

							}
							else if (post.visibility == "everyone"){
								allowed_posts.push(post);
							}
							else if (post.visibility == "friends"){
								for (j = 0; j < req.user.friends ; j++){
									if(req.user.friends[j] == post.postto){
										allowed_posts.push(post);
									}
								}
							}
							else if (post.visibility == "specific"){
								permission.findOne({'postId': docs._id}, function(err,poster){
									var allowed = poster.permissionableUser;
									allowed.forEach(function(person){
										if (req.user == person){
											allowed_posts.push(post);
										}
									});
								});
							}
						});
						// var currentUser = req.user;
						// var collection = req.db.collection('friendships');
						// collection.find({'requested':currentUser._id, 'status':'Pending'}, function(err, request){
						// 		var suggested =[];
						// 		currentUser.getFriendsOfFriends(function(err, fof){
						// 			var suggested = fof;
						// 			if(fof.length == 0){
						// 	 			User.find({'Major':currentUser.Major},function(err, users){suggested = users});
						// 			}
									User.find({'_id':{$in:sid.friends}},function(err, friends){
										res.render('profile.ejs',{
											postlist: allowed_posts,
											user: req.user,
											owner:sid,
											friends: friends,

										});


						});
});
				}

			});
});


	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	app.get('/coursepoll', isLoggedIn,function(req,res){
		Poll.find({}).populate('postby').exec(function(err, polls){
			var find =[];
				polls.forEach(function(p){
					find.push(include(req.user._id, p.voter));
				});
				console.log(find);
				res.render('pollview.ejs',{
					user:req.user,
					 pollist:polls,
					 voted: find,
				 });
			});

	});



	app.post('/createpoll', isLoggedIn, function(req, res){
		var options= req.body.options_value.split("||");
		var newPoll = Poll();
		 newPoll.postby =req.user._id;
		 newPoll.body =req.body.description;
		 newPoll.date = moment().format();
		 newPoll.course = req.body.course;
		 options.forEach(function(op){
			 if(op==''){return;}
			 var option = {text:op};
			 newPoll.options.push(option);
		 });
		 newPoll.save(function(err){
			 if(err){
				 console.log(err);
			 }
			 else {
			 	res.redirect(req.get("referer"));
			 }
		 })

	});
	app.post('/post', isLoggedIn, function(req,res, done){
		User.findOne({'local.email':req.body.email}, function(err, u){
		newPost(req.user._id, u._id, req.body.message,req.body.visibility,req,res);
	});
});
app.post('/gpost', isLoggedIn, function(req,res, done){
	newPost(req.user._id, req.body.group_id, req.body.message,"everyone",req,res);
});

	app.post('/requestFriend', isLoggedIn, function(req, res){
		User.findOne({'local.email':req.body.email}, function(err, u) {
			if(err) {console.log(err);}else{
			var friendToRequest = u._id;
			var currentUserId = req.user;
			currentUserId.friendRequest(friendToRequest, function (err, request) {
	           console.log('request', request);
			    res.redirect(req.get('referer'));

			});
			}
		});
	});

	app.post('/denyRequest', isLoggedIn, function (req, res){
		var friendToDeny = req.body.requester;
		var currentUserId = req.user;
		currentUserId.denyRequest(friendToDeny, function (err, denied) {
			res.redirect(req.get('referer'));
		    console.log('denied', denied);
		    // denied 1
		});
	});

	app.post('/acceptRequest', isLoggedIn, function (req, res){
		var friendToAdd = req.body.requester;
		var currentUserId = req.user;
		currentUserId.acceptRequest(friendToAdd, function (err, friendship) {
		User.findOne({'_id':friendToAdd}, function(err, user){
			user.friends.push(req.user);
			user.save();
		});
		User.findOne({'_id':req.user}, function(err, user){
			user.friends.push(friendToAdd);
			user.save();
		});
           console.log('friendship', friendship);
		    res.redirect(req.get('referer'));

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
// socket io to handle incoming messaging
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
// socket io to handle incoming post comment
	socket.on('profile_comment',function(info){
		User.findOne({'local.email':info.user_id}, function(err, user){
			Post.findById(info.post_id,function(err, post){
				var post_comment = {
				text :info.comment,
				date : moment().format(),
				postby :user,};
				post.comments.push(post_comment);
				post.save(function(err){
					if(err){console.log("how this possible?")}
				});
			});
	});
		io.emit('profile_comment', info.comment);
});
// socket io to handle incoming poll vote
	socket.on('vote', function(info){
		User.findOne({'local.email':info.user_id}, function(err,user){
			Poll.findOne({'_id':info.poll_id},function(err, poll){
				poll.voter.push(user._id);
				poll.options.forEach(function(op){
					if(op._id == info.option_id){
						op.total_vote = parseInt(op.total_vote)+1;
					}
				});
				poll.save(function(err){
					if(err){console.log(err);}
						var ops =[];
						poll.options.forEach(function(op){
						ops.push(op);
					});
						var info = {totalVote: poll.__v, Options: ops};
						io.emit('vote', info);
				});
			});
		});
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

function picture_upload(destination){

}

function include(e, array){
	var find = false;
	array.forEach(function(a){
		var n = new String(e).localeCompare(new String(a));
		console.log(n);
		if(n ==0){
			find = true;
			return;
		}
	});
	return find;
}
