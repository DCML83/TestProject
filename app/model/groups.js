//app/models/user.js
//load modules

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;

//define the schema for the group model

var members = new Schema({
	memUser : [{type: ObjectId, ref: 'User'}],
});

var groupSchema = mongoose.Schema({
	owner: [{type: ObjectId, ref: 'User'}],
	image: {type: String, default: 'images/group'},
	title: String,
	description: String,
	//body: String,
	members: [members],
	posts: [{type: ObjectId, ref: 'Post'}]
});


// create the model for users and expose it to the app
//module.exports = mongoose.model('User', userSchema);
var Group = mongoose.model('Group', groupSchema);

exports.Group = Group;
