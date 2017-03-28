var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;

//define schema for the lost and found,
var lostFound = new Schema({
	postby: [{type: ObjectId, ref: 'User'}],
	body: String,
	date: Date,
	picture: String,
  location: String,
	contact:{
		phone: {type: String,require :true},
    email:{type:String, require:true}},
})

var lostFound = mongoose.model('lostFound', lostFound);

exports.lostFound= lostFound;
