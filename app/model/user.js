//app/models/user.js
//load modules
//var friends = require("mongoose-friends");
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var ObjectId = mongoose.Schema.Types.ObjectId;
//define the schema for the user model

var userSchema = mongoose.Schema({
	local	: {
		email: {type: String,unique: true,},
		password: String,
		active: {type:Boolean,default:false}},
	name: {
		first: { type: String},
		last: { type: String}},
	birthday: Date,
	gender:String,
	Major:String,
	Year: String,
	resume:{type:String, default:'noresume'},
	visibility:{type: String,default: 'everyone'},
	image: {type: String,default: 'images/user.png'},
	friends:[{type : ObjectId, ref: 'User' }],
	group:[{type : ObjectId, ref: 'Group' }],
});



var options = {
	    personModelName:            'User',
	    friendshipModelName:        'Friend_Relationships',
	    friendshipCollectionName:   'friendships',
	};

var FriendsOfFriends = require('friends-of-friends')(mongoose,options);

userSchema.plugin(FriendsOfFriends.plugin, options);

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to the app

var User = mongoose.model(options.personModelName, userSchema);

module.exports = {User: User};
