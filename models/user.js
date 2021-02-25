var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSchema = new Schema( {

	uniqueId: String,
	email: String,
	// username: String,
	firstName : String,
	lastName : String,
	userType : String,
	password: String,
	passwordConf: String
}),
User = mongoose.model('User', userSchema);

module.exports = User;
