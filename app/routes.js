var User = require('../app/model/user').User;
var FriendsOfFriends = require('../app/model/user').FriendsOfFriends;
var db = require('../config/database.js');
var Post  = require('../app/model/posts').Post;
var Group = require('../app/model/groups').Group;
var lostFound = require('../app/model/lostFound').lostFound;
var Poll= require('../app/model/poll').Poll;
var Schedule = require('../app/model/schedule').Schedule;
var Permissions = require('../app/model/permission').Permissions;
var moment = require('moment');
var multer = require('multer');
var upload = multer({ dest:__dirname + '/public/upload/temp' });
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var md5 = require("blueimp-md5");
var path = require('path');
var friendsOfFriends = require('friends-of-friends');
var rootpath = path.dirname(require.main.filename);
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
module.exports = function(app, server, passport) {
	var io = require('socket.io')(server);
	var nodemailer = require("nodemailer");
	var mailOptions,host,link;
	var smtpTransport = nodemailer.createTransport("SMTP",{
	  service: "gmail",
	  auth:{
	      user: "multiculturalteam67@gmail.com",
	      pass: "qwe12332"
	    }
	  });


	//home page
	app.get('/', function(req, res) {
		res.render('index.ejs',{ smessage: req.flash('signupMessage'), lmessage:req.flash('loginMessage') }); // load the index.ejs file
	});


	app.get('/lostandfound', isLoggedIn, function(req,res){

		lostFound.find({}).populate('postby').exec(function(err, docs){
		req.user.getReceivedRequests(function(err,request){
		 res.render('lostFound.ejs',{
				'postlist' : docs,
				user : req.user,
				requestStatus:request,
			});
		});
		});
	});

	app.get('/friend', isLoggedIn, function(req,res){
		var currentUser=req.user;
  User.find({'_id':{$in:currentUser.friends}},function(err, friends){
		var suggested =[];
		currentUser.getFriendsOfFriends(function(err, fof){
			fof.forEach(function(f){
				if (include(f._id,currentUser.friends)){return;}
					suggested.push(f);
				});

			User.find({$and:[{'Major':currentUser.Major},{'_id':{$ne:currentUser._id}}]},function(err, users){
				users.forEach(function(user){
					if (include(user._id,currentUser.friends)){return;}
						suggested.push(user);
					});
			});
		currentUser.getReceivedRequests(function(err,request){
    res.render('Friends.ejs',{
      user: req.user,
      friends: friends,
			suggestedFriends:suggested,
			requestStatus:request,

    });
	});
  });
});
});

	app.get('/group', isLoggedIn, function(req,res, done){
		Group.find({'_id': {$in: req.user.group}}, function(err,groups){
			req.user.getReceivedRequests(function(err,request){
				res.render('Groups.ejs',{
				user:req.user,
				groups: groups,
				requestStatus:request,
			});
			});
		});
	});
app.get('/group/:email', isLoggedIn, function(req, res){
	Group.findOne({'name':req.params.email}).populate('posts').exec(function(err, g){
		console.log(g);
			req.user.getReceivedRequests(function(err,request){
				console.log(g.posts);
			res.render('group-profile.ejs',{
					user:req.user,
					group:g,
					postlist:g.posts,
					requestStatus:request,
			});
			});
	});
	});
	app.get('/setting', isLoggedIn, function(req,res){
		req.user.getReceivedRequests(function(err,request){
		res.render('editProfile.ejs',{
				user:req.user,
				requestStatus:request,
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
		var tmp_path = req.file.path;
		var mimetype = req.file.mimetype.split("/");
		var extension = mimetype[1];
		var name  = md5(req.file.filename);
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
var type = upload.single('picture');
app.post('/edit_profile_image', type, isLoggedIn, function(req,res){
	var tmp_path = req.file.path;
	var mimetype = req.file.mimetype.split("/");
	var extension = mimetype[1];
	var name  = req.user._id + "_profile";
	destination ='upload/profile/' + name+"."+extension;
	var target_path = rootpath + '/public/'+destination;
	var src = fs.createReadStream(tmp_path);
	var dest = fs.createWriteStream(target_path);
	src.pipe(dest);
	src.on('end', function() {});
	src.on('error', function(err) { console.log(err); });
	User.findOne({'_id':req.user._id}, function(err, user){
		user.image =destination;

		user.save(function(err){
			if(err){
				console.log(err);
			}else{
				res.redirect(req.get('referer'));
			}
		})
	});
});
app.post('/removelfpost', isLoggedIn, function(req,res){
	console.log(req.body.post);
	lostFound.findOneAndRemove({'_id': req.body.post},function(err) {
    	res.redirect('/lostandfound');
		});
});
app.post('/updateName', isLoggedIn,function(req, res){
	var currentUser = req.user._id;
	var newName = req.body.fName;
	var newLname = req.body.lName;
	console.log(newLname);
	 User.findByIdAndUpdate(req.user._id,
		        {$set: {'name.first': newName,
		        	'name.last': newLname}},

		        //{new: true},
		        function(err,user){
		            if(err){
		                res.send({error :err}) ;
		            } else{
		            	res.redirect(req.get('referer')); ;
		            }
		        });
});

app.post('/updateBirthday', isLoggedIn,function(req, res){
	var currentUser = req.user._id;
	var newDate = moment().format();
	var bday = new Date(req.body.year, req.body.month - 1, req.body.day);
	console.log(newDate);
	 User.findByIdAndUpdate(req.user._id,
		        {$set: {'birthday': bday}},

		        //{new: true},
		        function(err,user){
		            if(err){
		                res.send({error :err}) ;
		            } else{
		            	res.redirect(req.get('referer'));
		            }
		        });
});

app.post('/updatePassword', isLoggedIn,function(req, res){
	var currentUser = req.user._id;
	var password = req.body.password;
	 User.findByIdAndUpdate(req.user._id,
		        {$set: {'local.password': generateHash(password)}},

		        //{new: true},
		        function(err,user){
		            if(err){
		                res.send({error :err}) ;
		            } else{
		            	res.redirect(req.get('referer'));
		            }
		        });
});

app.post('/updateVisibility', isLoggedIn,function(req, res){
	var currentUser = req.user._id;
	var newVisibility = req.body.visibility;
	 User.findByIdAndUpdate(req.user._id,
		        {$set: {'visibility': newVisibility}},

		        //{new: true},
		        function(err,user){
		            if(err){
		                res.send({error :err}) ;
		            } else{
		            	res.redirect(req.get('referer'));
		            }
		        });
});

app.post('/saveDate', isLoggedIn, function(req, res, done){
	var newSchedule = new Schedule();
		newSchedule.text = req.body.cName;
		newSchedule.start_date = req.body.sDate;
		newSchedule.end_date = req.body.eDate;
		var pre = new Date(req.body.sDate);
		var post = new Date(req.body.eDate);
		var timeTotal = (post-pre)/1000;
		newSchedule.rec_type = "week_1___"+req.body.options;
		newSchedule.event_length = "7200";
		newSchedule.owner = req.user;
		newSchedule.save(function(error){
			if (!error){
				User.findOne({'_id':req.user.id},function(err, user){
					user.course.push(newSchedule.id);
					user.save(function(err){
						if(err){console.log(err);}
					})
				});
				res.redirect(req.get('referer'));
				return done(null, newSchedule);
			}
		});

});
var pdf=upload.single('pdf');
app.post('/uploadresume', pdf, isLoggedIn, function(req,res){
	var tmp_path = req.file.path;
	var mimetype = req.file.mimetype.split("/");
	var extension = mimetype[1];
	var name  = req.user._id+"_resume";
	destination ='upload/profile/' + name+"."+extension;
	var target_path = rootpath + '/public/'+destination;
	var src = fs.createReadStream(tmp_path);
	var dest = fs.createWriteStream(target_path);
	src.pipe(dest);
	src.on('end', function() {});
	src.on('error', function(err) { console.log(err); });
	User.findOne({'_id':req.user._id}, function(err, user){
		user.resume = destination;
		user.save(function(err){
			if(err){
				console.log(err);
			}
		});
	});
});
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this ( the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req,res, done){
		var currentUser = req.user;
		Post.find({postto: currentUser._id}).populate('postby').exec(function(err, posts){
				req.user.getReceivedRequests(function(err,request){
							User.find({'_id':{$in:currentUser.friends}},function(err, friends){
								posts.reverse();
								res.render('profile.ejs',{
									postlist: posts,
									user: req.user,
									owner:req.user,
									friends: friends,
									requestStatus: request,
									// suggestedFriends: suggested,

							});
						});
				});
			});
		});

app.get('/data/:id', function(req, res){
	//Schedule.find({owner: req.user._id}, function(error, thing){
	var id = new ObjectId(req.params.id);
	Schedule.find({'owner': id}, function(err, data){
        //set id property for all records
        for (var i = 0; i < data.length; i++)
            data[i].id = data[i]._id;

        //output response
        res.send(data);
	//	});
    });
});
			app.get('/profile/:id', isLoggedIn, function(req,res){
				var owner = req.params.id;
				User.findOne({'local.email': owner}, function (err, sid){
						Post.find({postto: sid}).populate('postby').exec(function(err, posts){
						var allowed_posts = [];
						posts.forEach(function(post){
							if (compareString(post.visibility,"me")){
								if (compareString(post.postto,req.user._id)){
										allowed_posts.push(post);
								}
							}
							else if (compareString(post.visibility,"everyone")){
								console.log(compareString(post.visibility,"everyone"));
								allowed_posts.push(post);
							}
							else if (compareString(post.visibility,"friends")){
								console.log(compareString(post.visibility,"friends"));
								req.user.friends.forEach(function(f){
									if(compareString(f,post.postto)){
										allowed_posts.push(post);
									}
								});
							}
							else if (compareString(post.visibility, "specific")){
								Permissions.findOne({'postid': post._id}, function(err,poster){
									var allowed = poster.permissionableUser;
									allowed.forEach(function(person){
										if (compareString(req.user._id,person)){
											allowed_posts.push(post);
										}
									});
								});
							}
						});
						allowed_posts.reverse();
						var currentUser = req.user;
						var collection = req.db.collection('friendships');
						collection.find({'requested':currentUser._id, 'status':'Pending'},function(err, request){
									User.find({'_id':{$in:sid.friends}},function(err, friends){
										res.render('profile.ejs',{
											postlist: allowed_posts,
											user: req.user,
											owner:sid,
											requestStatus:request,
											friends: friends,

										});
									});
								});
							});
						});
					});


	// logout
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/coursepoll', isLoggedIn,function(req,res){
		var list=[];
		list = req.user.friends.concat(req.user._id);
		console.log(list);
		Poll.find({'postby':{$in:list}}).populate('postby course').exec(function(err, polls){
			var find =[];
			var pollist =[];
			console.log(polls);
			User.findOne({'_id':req.user._id}).populate('course').exec(function(err,user){
				console.log(user);
				polls.forEach(function(p){
					find.push(include(req.user._id, p.voter));
					user.course.forEach(function(c){
						if(compareString(p.course.text,c.text)){
								pollist.push(p);
						}
					});

				});
				console.log(pollist);
				Schedule.find({'owner':req.user._id},function(err,course){
				req.user.getReceivedRequests(function(err,request){

				res.render('pollview.ejs',{
					 user:req.user,
					 pollist:pollist,
					 voted: find,
					 course:course,
					 requestStatus:request,
				 });
			 });
				 	});
						});
			});
		});



	app.post('/createpoll', isLoggedIn, function(req, res){
		if (req.body.course ==''){
			res.redirect(req.get("referer"));
		}
		else{
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
			});
		}
		});
	app.post('/post', isLoggedIn, function(req,res, done){
		User.findOne({'local.email':req.body.email}, function(err, u){
			newPost(u,req,res);
		});
	});
	app.post('/gpost', isLoggedIn, function(req,res, done){
		Group.findOne({'_id':req.body.group_id},function (err,group){
			console.log(group);
			var newPost = new Post();
			newPost.postby = req.user.id;
			newPost.postto = group._id;
			newPost.body = req.body.message;
			newPost.date = moment().format();
			newPost.save(function(err){
				group.posts.push(newPost._id);
				group.save(function(err){

				});
				res.redirect(req.get('referer'));
			});
		});
	});

	app.post('/requestFriend', isLoggedIn, function(req, res){
		User.findOne({'local.email':req.body.email}, function(err, u) {
			if(err) {console.log(err);}
			else{
			var friendToRequest = u._id;
			var currentUserId = req.user;
			currentUserId.friendRequest(friendToRequest, function (err, request) {
			    res.redirect(req.get('referer'));
			});
			}
		});
	});

	app.post('/denyRequest', isLoggedIn, function (req, res){
		var friendToDeny = req.body.requester;
		var currentUserId = req.user;
		currentUserId.denyRequest(friendToDeny, function (err, denied) {
		});
	});

	app.post('/joingroup', isLoggedIn,function(req,res){
		Group.findOne({'_id':req.body.id},function(err, group){
			group.members.push(req.user._id);
			User.findOne({'_id':req.user._id},function(err,user){
				user.group.push(group._id);
				group.save();
				user.save();
				res.redirect(req.get('referer'));
			});
		});

	});
	app.post('/acceptRequest', isLoggedIn, function (req, res){
		console.log(req.body.requester);
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
		    res.redirect(req.get('referer'));

			});

		});

	app.get('/profile-temp', isLoggedIn, function(req,res){
		if(req.user.local.active){
			  res.redirect("/profile");}
			else {
					host = req.get('host');
					link ="http://"+req.get('host')+"/verify?id="+req.user._id;
					mailOptions = {
						from:"multiculturalteam67@gmail.com",
					    to :req.user.local.email,
					    subject:"MUNSSN email confirmation--Please confirm your Email Account",
					    html:"<head><link rel='stylesheet' href='https://www.w3schools.com/w3css/4/w3.css'></head>"+
							"<body>"+
							"<div class='w3-card w3-center'>"+
							"Hello, <h3> Please Click on the link to verify your email.</h3>"+
							"<br><a class='w3-button w3-red' href ="+link+">"+
							"Click here to verify</a>"+
							"</div>"+
							"</body>",
					  };
					  smtpTransport.sendMail(mailOptions,function(error, res){
					    if (error){
					      console.log(error);

					    }else{
								res.render('profile-temp.ejs', {});
					      console.log("Message sent: " + res.message);
					    }
					  });
					}
				});


	app.get('/verify',function(req,res,done){
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
								res.redirect('/');
        });
	});

	// process the signup from
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile-temp', // redirect to the secure profile section
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
		req.user.getReceivedRequests(function(err,request){
	  res.render('chatroom.ejs',{
			user: req.user,
			requestStatus:request,
		});
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

	socket.on('searchfriend', function(msg){
		var userlist=[];
		var patt =new RegExp(msg.search.toUpperCase());
		User.find({},function(err,users){
			users.forEach(function(user){
				var name = user.name.first.toUpperCase() + user.name.last.toUpperCase();
				n = name.search(patt);
				console.log(n);
				if(n != -1){
					userlist.push(user);
				}

			});

		JSON.stringify(userlist);
	io.emit('searchfriend', userlist);
	});
});

socket.on('searchgroup', function(msg){
	var grouplist = [];
	var patt = new RegExp(msg.search.toUpperCase());
	Group.find({},function(err,groups){
		groups.forEach(function(group){
			var name = group.name.toUpperCase();
			n = name.search(patt);
			console.log(n);
			if(n != -1){
				grouplist.push(group);
			}

		});

	JSON.stringify(grouplist);
io.emit('searchgroup', grouplist);
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

function newPost(u,req, res){
	var newPost = new Post();
	newPost.postby = req.user.id;
	newPost.postto = u;
	newPost.body = req.body.message;
	newPost.date = moment().format();
	newPost.visibility = req.body.visibility;

	newPost.save(function(error) {
		if (!error) {
			n = new String(newPost.visibility).localeCompare(new String('specific'));
			if (n == 0){
				var newPermission = new Permissions();
				newPermission.postid = newPost._id;
				var friends= req.body.friendlist.split("|");
				console.log(friends);
				friends.forEach(function(f){
					if (f ==''){return;}
					newPermission.permissionableUser.push(f);
				});
				newPermission.save(function(err){if(err){console.log(err)}});
			}
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
		if(compareString(a,e)){
			find = true;
			return;
		}
	});
	return find;
}
function remove(array, element) {
    const index = array.indexOf(element);
    array.splice(index, 1);
}

function compareString(a,b){
	var n = new String(a).localeCompare(new String(b));
	if (n==0){
		return true;}
	return false;}
