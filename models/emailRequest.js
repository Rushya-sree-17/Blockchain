var mongoose = require('mongoose');
var Schema = mongoose.Schema;

emailRequestSchema = new Schema( {
    uniqueMailId: Number,
    userId : String,
    messageId : String,
    emailTimeStamp : String,
    judiciaryId : String,
    currTimeStamp : { type: Date, default: Date.now},
    status : { type: String,default:"Pending"}
}),
EmailRequest = mongoose.model('EmailRequest', emailRequestSchema);

module.exports = EmailRequest;
