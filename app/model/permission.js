var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;

//define the schema for the post model
// var getFriends = new Schema ({
// 	friends : []
// });

var permissionSchema = new Schema({
	postid : {type: ObjectId, ref : 'Posts'},
	permissionableUser : [{type: ObjectId, ref: 'User'}]
	});


var Permissions = mongoose.model('Permissions', permissionSchema);

exports.Permissions = Permissions;
