//app/models/user.js
//load modules

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//define the schema for the user model

var userSchema = mongoose.Schema({

	local	: {
		email	: String,
		password: String,
		active:{type:Boolean, default:false}
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
	}
});



//var User = mongoose.model('User', userSchema);
// methods
// generating a hash

userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
};
// //checking if it is active
// userSchema.metods.checkActive = function(){
// 	return this.local.active;
// };
// create the model for users and expose it to the app
module.exports = mongoose.model('User', userSchema);
//module.exports = {User: User};

//module.exports = mongoose.model('Profile', profileSchema);
