var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;

//define the schema for the post model
var getFriends = new Schema ({
	friends : [{type: ObjectId, ref: 'User'}]
});

var permissionSchema = new Schema({
	postId : [{type: ObjectId, ref : 'Posts'}],
	permissionableUser : [getFriends]
	});


var Permissions = mongoose.model('Permissions', permissionSchema);

exports.Permissions = Permissions;
