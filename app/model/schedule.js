//app/models/user.js
//load modules

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;
var int = Schema.Types.Long;
//define the schema for the group model


var scheduleSchema = mongoose.Schema({
	start_date: Date,
	end_date: Date,
	text: String,
	rec_type: String,
	event_length: String,
	owner: {type: ObjectId, ref: 'User'},
});


// create the model for users and expose it to the app
//module.exports = mongoose.model('User', userSchema);
var Schedule = mongoose.model('Schedule', scheduleSchema);

exports.Schedule = Schedule;
