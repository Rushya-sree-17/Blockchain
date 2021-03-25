var express = require('express');
var router = express.Router();
var User = require('../models/user');
var EmailRequest = require('../models/emailRequest');
var fs = require('fs');
var busboy = require('connect-busboy');
var path = require('path');
var formidable = require('formidable');
const multer = require('multer');
var mime    =   require('mime');
var request = require('request');
var emlformat = require('eml-format');
const EthCrypto = require('eth-crypto');
//...
router.use(busboy());

var storage	=	multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    console.log(file);
    callback(null, file.fieldname + '-' + Date.now() + '.' + mime.extension(file.mimetype));
  }
});
var upload = multer({ storage : storage }).array('userPic');

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

var randToken = require('rand-token');

const addContent =  ({path, content}) => {
	const fileContent = {path: path, content: content};
	const  fileAdded =  ipfs.add(fileContent);
	console.log(fileContent);
	console.log(fileAdded[0].hash);
	return fileAdded[0].hash;
}

function passwordGen() {
	return randToken.generate(10);
}

router.get('/', function (req, res, next) {
	return res.render('index.ejs');
});

router.get('/app', function (req, res, next) {
	return res.render('App.js');
});

router.post('/', function(req, res, next) {
	console.log(req.body);
	var personInfo = req.body;


	if(!personInfo.uniqueId || !personInfo.email || !personInfo.firstName || !personInfo.lastName || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({$or : [{uniqueId:personInfo.uniqueId},{email:personInfo.email}]},function(err,data){
				if(!data){
					var c;
					User.findOne({},function(err,data){

						var newPerson = new User({
							uniqueId:personInfo.uniqueId,
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

					})
					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"ID/email is already in use"});
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
				req.session.userId = data.uniqueId;
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


router.post('/adminData', function (req, res, next) {
	console.log("req body");
	console.log(req.body);
	var emailUniqueId = req.body.uniqueMailId;
	var content = req.body.emailContent;
	var statusToBeUpdated = "Mail Sent to judiciary";
console.log(emailUniqueId);
if(content === "Invalid request")
{
	statusToBeUpdated = "Invalid request";
}
EmailRequest.updateOne({"uniqueMailId" : emailUniqueId},{"status" : statusToBeUpdated,"content":content},function(err){
	if(err){
		console.log(err);
	}else{
		console.log("Success");
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
							c = data.uniqueMailId + 1;
						}else{
							c=1;
						}

						// User.findOne()

						var newEmailRequest = new EmailRequest({
							uniqueMailId : c,
							userId : req.session.userId,
							messageId : emailReqInfo.messageId,
							emailTimeStamp : emailReqInfo.emailTimeStamp,
							judiciaryId : emailReqInfo.judiciaryId,
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



router.post('/addJudiciary', function (req, res, next) {
	console.log(req.body);
	var judiciaryDetails = req.body;


	if(!judiciaryDetails.uniqueId || !judiciaryDetails.firstName || !judiciaryDetails.lastName || !judiciaryDetails.emailId ){
		res.send();
	} else {
			User.findOne({uniqueId : judiciaryDetails.uniqueId },function(err,data){
				if(!data){
					var c;
					var pass = passwordGen();

						var newJudiciary = new User({
						    uniqueId: judiciaryDetails.uniqueId,
							email: judiciaryDetails.emailId,
							firstName: judiciaryDetails.firstName,
							lastName : judiciaryDetails.lastName,
							userType : "Judiciary",
							password : pass,
							passwordConf : pass
						});

						newJudiciary.save(function(err,JudiciaryData){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});

					res.send({"Success":"Judiciary Details added successfully."});
				}else{
					res.send({"Success":"Judiciary Id is already added."});
				}

			});
	}
});

router.post('/removeJudiciary', function (req, res, next) {
	console.log(req.body);
	var judiciaryDetails = req.body;


	if(!judiciaryDetails.uniqueId ){
		res.send();
	} else {
			User.deleteOne({uniqueId : judiciaryDetails.uniqueId },function(err){
				if(!err){
					res.send({"Success":"Judiciary deleted Successfully."});
				}else{
					res.send({"Success":"Judiciary not found"});
				}

			});
	}
});

router.get('/searchMail/:id',function(req,res,next){
	EmailRequest.updateOne({"uniqueMailId" : req.params.id},{"status" : "Mail Sent to judiciary"},function(err){
		if(err){

			console.log(err);
		}else{
			console.log("Success");
			// res.redirect("/profile");
		}
	});
});


router.get('/profile', function (req, res, next) {
	console.log("profile");
	console.log(req.session);
	User.findOne({uniqueId:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);

		if(!data){
			res.redirect('/');
		}else{
			if(data.userType=="generalUser"){
				console.log("hii");

				EmailRequest.find({userId:req.session.userId}, function(err, emailRequestData1){
					if(err)
					{

						console.log(err);
					}
					else{
					console.log(emailRequestData1);
					return res.render('data.ejs', {"name":data.firstName,"email":data.email,"emailRequestData":emailRequestData1});
					}
				});
			}
			else if(data.userType == "admin"){
				EmailRequest.find({}, function(err, emailRequestData1){
					return res.render('adminData.ejs', {"name":data.firstName,"email":data.email,"emailRequestData":emailRequestData1});
				});
			}else if(data.userType == "Judiciary"){
				// console.log("else");
				EmailRequest.find({judiciaryId:req.session.userId}, function(err, emailRequestData1){
					return res.render('judiciaryData.ejs', {"name":data.firstName,"email":data.email,"emailRequestData":emailRequestData1});
				});
			}
		}
	});
});



router.post('/addEmail',   function(req,res,next) {
  var url = req.body.url;
  console.log(url);
  //temporary one
const message = url;
const msgHash = EthCrypto.hash.keccak256(message);


const publicKey = EthCrypto.publicKeyByPrivateKey(
     'b8d6067b4b4280913872fe826cdec4dc0179009f9c3432f72074e77189b58c37'
 );
 console.log("public key "+publicKey);

 const address = EthCrypto.publicKey.toAddress(
      publicKey
  );
  
 console.log("address "+address);
res.send({"success":"Sucsess","timeStamp":"timeStampt", "messageId":"messageIdt", "email":"emailt"});
//uncomment
  // request.get(url, function (error, response, body) {
  //     if (!error && response.statusCode == 200)
  //     {
  //         var eml = body;
  //         // console.log(body);
  //
  //         emlformat.read(eml, function(error, data) {
  //             if (error) return console.log(error);
  //             var timeStamp = data["headers"]["Date"];
  //             var messageId = data["headers"]["Message-ID"];
  //             var email = data["from"]["email"];
  //             console.log(timeStamp + " " + messageId + " " + email );
  //
  //             res.send({"success":"Success", "timeStamp":timeStamp,
  //                       "messageId":messageId, "email":email});
  //         });
  //     }
  // });
//uncomment
});

router.get('/addEmail',function(req,res,next){

	User.findOne({uniqueId:req.session.userId},function(err,data){
		// console.log("data");
		// console.log(data);
		if(!data){
			res.redirect('/');
		}else{

			res.render('addEmail.ejs', {"data" : data});

		}
	});
});


router.get('/findMyEmail',function(req,res,next){
	User.findOne({uniqueId:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			User.find({userType:"Judiciary"},function(err,data){
				if(!data){
					res.render('findMyEmail.ejs');
				}else{
					res.render('findMyEmail.ejs',{"judiciaries" : data});
				}
			});

		}
	});
});



router.get('/decryptPage',function(req,res,next){
	User.findOne({uniqueId:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			User.find({userType:"Judiciary"},function(err,data){
				if(!data){
					res.render('decryptPage.ejs');
				}else{
					res.render('decryptPage.ejs',{"judiciaries" : data});
				}
			});

		}
	});
});


router.get('/addJudiciary',function(req,res,next){
	User.findOne({uniqueId:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			res.render('addJudiciary.ejs');
		}
	});
});

router.get('/removeJudiciary',function(req,res,next){
	User.findOne({uniqueId:req.session.userId},function(err,data){
		console.log("data");
		console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			res.render('removeJudiciary.ejs');
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

router.post('/profile',function(req,res,next){
	console.log(req.body);
	var uniqueMailId = req.body.uniqueMailId;
	console.log("hi");
	console.log(uniqueMailId);
	console.log("hi2");
	res.send();
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
