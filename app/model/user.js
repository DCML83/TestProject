//app/models/user.js
//load modules

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var ObjectId = require('mongodb').ObjectID;
//define the schema for the user model

var userSchema = mongoose.Schema({

	local	: {
		email	: String,
		password: String,
	},
	name: { 
		first: {
			type: String,
			//required: true
		},
		last: {
			type: String, 
			//required: true
		}
	},
	bdate : {
		type: Date,
		//required: true
	},
	
	image: {
		type: String,
		default: 'images/user.png'
	},
	
	friends:[{type : ObjectId, ref: 'User' }]
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

