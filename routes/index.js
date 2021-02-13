var express = require('express');
var router = express.Router();
var User = require('../models/user');
var EmailRequest = require('../models/emailRequest');

router.get('/', function (req, res, next) {
	return res.render('index.ejs');
});


router.post('/', function(req, res, next) {
	console.log(req.body);
	var personInfo = req.body;


	if(!personInfo.email || !personInfo.firstName || !personInfo.lastName || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({email:personInfo.email},function(err,data){
				if(!data){
					var c;
					User.findOne({},function(err,data){

						if (data) {
							console.log("if");
							console.log(data);
							c = data.unique_id + 1;
						}else{
							c=1;
						}

						var newPerson = new User({
							unique_id:c,
							email:personInfo.email,
							firstName: personInfo.firstName,
							lastName: personInfo.lastName,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf,
							userType : "generalUser"
						});

						newPerson.save(function(err, Person){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});

					}).sort({_id: -1}).limit(1);
					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"Email is already used."});
				}

			});
		}else{
			res.send({"Success":"password is not matched"});
		}
	}
});

router.get('/login', function (req, res, next) {
	return res.render('login.ejs');
});

router.post('/login', function (req, res, next) {
	//console.log(req.body);
	User.findOne({email:req.body.email},function(err,data){
		if(data){

			if(data.password==req.body.password){
				//console.log("Done Login");
				req.session.userId = data.unique_id;
				//console.log(req.session.userId);
				res.send({"Success":"Success!","userType":data.userType});

			}else{
				res.send({"Success":"Wrong password!"});
			}
		}else{
			res.send({"Success":"This Email Is not regestered!"});
		}
	});
});

router.post('/findMyEmail', function (req, res, next) {
	console.log(req.body);
	var emailReqInfo = req.body;


	if(!emailReqInfo.messageId || !emailReqInfo.emailTimeStamp){
		res.send();
	} else {
			EmailRequest.findOne({messageId:emailReqInfo.messageId,emailTimeStamp:emailReqInfo.emailTimeStamp},function(err,data){
				if(!data){
					var c;
					EmailRequest.findOne({},function(err,data){

						if (data) {
							console.log("if");
							console.log(data);
							c = data.unique_id + 1;
						}else{
							c=1;
						}

						// User.findOne()

						var newEmailRequest = new EmailRequest({
							unique_id : c,
							user_id : req.session.userId,
							// email: req.session,
							// firstName: String,
							// lastName : String,
							messageId : emailReqInfo.messageId,
							emailTimeStamp : emailReqInfo.emailTimeStamp
						});

						newEmailRequest.save(function(err,EmailReqData){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});

					}).sort({_id: -1}).limit(1);
					res.send({"Success":"Request successful"});
				}else{
					res.send({"Success":"Request for this email is already Submitted"});
				}

			});
	}
});

router.get('/profile', function (req, res, next) {
	console.log("profile");
	console.log(req.session);
	User.findOne({unique_id:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);
		
		if(!data){
			res.redirect('/');
		}else{
			//console.log("found");

				if(data.userType=="generalUser"){
					EmailRequest.find({user_id:req.session.userId}, function(err, emailRequestData1){
						return res.render('data.ejs', {"name":data.firstName,"email":data.email,"emailRequestData":emailRequestData1});
					});
				}
				else if(data.userType == "admin"){
					EmailRequest.find({}, function(err, emailRequestData1){
						return res.render('adminData.ejs', {"name":data.firstName,"email":data.email,"emailRequestData":emailRequestData1});
					});
				}
				

		}
	});
});

router.get('/findMyEmail',function(req,res,next){
	User.findOne({unique_id:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			res.render('findMyEmail.ejs', {"name":data.firstName,"email":data.email});
		}
	});
});

router.get('/logout', function (req, res, next) {
	console.log("logout")
	if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
    	if (err) {
    		return next(err);
    	} else {
    		return res.redirect('/');
    	}
    });
}
});

router.get('/forgetpass', function (req, res, next) {
	res.render("forget.ejs");
});

router.post('/forgetpass', function (req, res, next) {
	//console.log('req.body');
	//console.log(req.body);
	User.findOne({email:req.body.email},function(err,data){
		console.log(data);
		if(!data){
			res.send({"Success":"This Email Is not regestered!"});
		}else{
			// res.send({"Success":"Success!"});
			if (req.body.password==req.body.passwordConf) {
			data.password=req.body.password;
			data.passwordConf=req.body.passwordConf;

			data.save(function(err, Person){
				if(err)
					console.log(err);
				else
					console.log('Success');
					res.send({"Success":"Password changed!"});
			});
		}else{
			res.send({"Success":"Password does not matched! Both Password should be same."});
		}
		}
	});

});

module.exports = router;


// pending..

// admin -> Request
// if(search is done)
//  if(found)
//  user -> pending -> judiciary details
//  judiciary -> file. (later)
// else
//  user -> pending -> mail not found


// Search -> 
// 1) admin -> Search -> waiting for judiciary details
// 2) message Req -> user -> status -> Enter judiciary details 
//  after submitting judiciary details by user -> admin -> judiciary details