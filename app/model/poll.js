

//app/models/posts.js
//load modules

var mongoose = require('mongoose');
require('mongoose-long')(mongoose)
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;
var Int = Schema.Types.Long;

//define schema for the posts, which store the comment as well
var polls = mongoose.Schema({
	postby: {type: ObjectId, ref: 'User'},
	body: String,
	date: Date,
  course: {type:ObjectId,ref:'Schedule'},
	voter:[{type: ObjectId, ref: 'User'}],
	options:[{
    text: String,
		total_vote: {type:Int, min:0, default:0},
  }],
});

var Poll = mongoose.model('Poll', polls);

exports.Poll = Poll;
