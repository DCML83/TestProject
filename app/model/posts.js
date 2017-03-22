

//app/models/user.js
//load modules

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var ObjectId = Schema.Types.ObjectId;

//define schema for the posts, which store the comment as well
var posts = mongoose.Schema({
	postby: [{type: ObjectId, ref: 'User'}],
    postto:[{type:ObjectId,ref:'User'}],
	body: String, 
	date: Date,
	comments: [{type: ObjectId, ref: 'Comment'}],
});

//define schema for the comments
var Comment = new Schema({
    username : [{type: ObjectId, ref: 'User'}],
    content  : String,
    created  : Date
    //Replycomments: [{type: ObjectId, ref: 'Comment'}]
});


// var lostFound = new posts('lostfound', {
//     location:{
//         type: String,
//         required: true,}
// });

// create the model for users and expose it to the app
//module.exports = mongoose.model('User', userSchema);
var Post = mongoose.model('Post', posts);
// var lostFound = mongoose.model('LostFound', lostFound);
exports.Post = Post;
// exports.lostFound = lostFound;

//module.exports = mongoose.model('Profile', profileSchema);

