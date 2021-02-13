var mongoose = require('mongoose');
var Schema = mongoose.Schema;

emailRequestSchema = new Schema( {
    unique_id: Number,
    user_id : Number,
	// email: String,
	// firstName: String,
    // lastName : String,
    messageId : String,
    emailTimeStamp : String,
    judiciaryDetails : String,
    currTimeStamp : { type: Date, default: Date.now},
    status : { type: Boolean,default:false}
}),
EmailRequest = mongoose.model('EmailRequest', emailRequestSchema);

module.exports = EmailRequest;
