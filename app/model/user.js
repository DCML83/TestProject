//app/models/user.js
//load modules

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//define the schema for the user model

var userSchema = mongoose.Schema({

	local	: {
		email	: String,
		password: String,
	},
	bdate : {
		type: String,
		required: true
	},
	facebook	:{
		id	: String,
		token	: String,
		email	: String,
		name	: String
	},
	twitter		:{
		id	: String,
		token	: String,
		displayName: String,
		username: String
	},
	google		:{
		id	:String,
		token	:String,
		email	:String,
		name	:String
	},
	friends:[{type : ObjectId, ref: 'User' }]
});

var profileSchema = mongoose.Schema({
	/*id: {
		type: Number, 
		required: true
	},
	*/
	name: { 
		first: {
			type: String,
			required: true
		},
		last: {
			type: String, 
			required: true
		}
	},
	bdate : {
		type: Date,
		required: true
	},
	
	image: {
		type: String,
		default: 'images/user.png'
	},
	login: {
		email:{
			type: String
		},
		password:{
			type: String
		}
	}, 
	friends:[{type : ObjectId, ref: 'User' }]
	
});


var Profile = mongoose.model('Profile', profileSchema);
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
//module.exports = mongoose.model('User', userSchema);
var User = mongoose.model('User', userSchema);

module.exports = {User: User,
				Profile: Profile
		};

//module.exports = mongoose.model('Profile', profileSchema);
