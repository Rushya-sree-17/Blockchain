var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var randToken = require('rand-token');



judiciarySchema = new Schema( {
	judiciary_id: Number,
	email: String,
	firstName : String,
	lastName : String,
    userType : {type : String, default : "Judiciary"},
    passwordConf: String,
	password: {
        type: String,
        default: function() {
            return randToken.generate(10);
        }
    }
	
})
Judiciary = mongoose.model('Judiciary', judiciarySchema);

module.exports = Judiciary;
