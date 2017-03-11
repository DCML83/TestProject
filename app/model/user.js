//app/models/user.js
//load modules

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var ObjectId = mongoose.Schema.Types.ObjectId;
//define the schema for the user model

var userSchema = mongoose.Schema({

	local	: {
		email: { 
			type: String,
			unique: true,
		},
		password: String,
	},
	// shift this to profile after testing
	friends:[{type : ObjectId, ref: 'User' }]
});

var profileSchema = mongoose.Schema({
	name: {
		first: { type: String},
		last: { type: String}
	},
	address: {type: String},
	birthDate: Date, 
	image: {
		type: String, 
		default: 'images/user.png'
	},
	
	friends: {
		// Accepted will have the status Boolean to true through a 'verb' nodeJS method
		accepted: [{type: ObjectId, ref: 'User', status: Boolean}],
		// Pending will have the status Boolean set to false 
		pending: [{type: ObjectId, ref: 'User', status: Boolean}],
		// rejected will have the status Boolean set to false as well and then we'll have to handle it to set it to this 
		rejected: [{type:ObjectId, ref: 'User', status:Boolean}]
	},
//	If the above doesn't work we can split them into individual parts 
//	friendsAccepted:
//		[{type: ObjectId, ref: 'User', status: Boolean}],
//	friendsPending:
//		[{type: ObjectId, ref: 'User', status: Boolean}],
//	friendsRejected:
//		[{type:ObjectId, ref: 'User', status:Boolean}],
//	
	login : [{type: ObjectId, ref: 'userSchema'}]
	
});

// methods
// generating a hash

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to the app

var User = mongoose.model('User', userSchema);

module.exports = {User: User};

