//app/models/user.js
//load modules

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;

//define the schema for the group model


var groupSchema = mongoose.Schema({
	owner: {type: ObjectId, ref: 'User'},
	image: {type: String, default: 'images/group.png'},
	name: String,
	description: String,
	type:String,
	//body: String,
	members: [{type: ObjectId, ref: 'User'}],
	posts: [{type: ObjectId, ref: 'Post'}],
});


// create the model for users and expose it to the app
//module.exports = mongoose.model('User', userSchema);
var Group = mongoose.model('Group', groupSchema);

exports.Group = Group;
