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
const buffer = require('buffer');
const fileupload = require('express-fileupload');
const fetch = require("node-fetch");
const utf8 = require('utf8');
const https = require('https');
//...
router.use(fileupload(), busboy());


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
const ipfs =  ipfsAPI('localhost', 5001);
// ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'})

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

router.post('/decryptPageAdmin', async function (req, res, next){

    console.log(req.body.url);
    console.log(req.body.privateKey);

    var privateKey = req.body.privateKey;
    var url = req.body.url;

      const publicKey = await EthCrypto.publicKeyByPrivateKey(privateKey);

      var ipfsData = "";
      let qwe = await fetch(url)
        .then(response => response.text())
        .then(text => {
          try {
            ipfsData = text;
              // console.log(text);
          } catch(err) {
            console.log(err);
             // It is text, do you text handling here
          }
        });
        // const temp = JSON.stringify(encrypted);
        // console.log(temp);
        // console.log(encrypted);
        console.log("Admin Data");
        console.log(ipfsData);
        const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKey, JSON.parse(ipfsData));
        console.log("decryptMessage in Admin " + decryptMessage);


});

router.post('/adminData', function (req, res, next) {
	console.log("req body");
	console.log(req.body);
	var emailUniqueId = req.body.uniqueMailId;
	var content = req.body.emailContent; // url

res.render('decryptPageAdmin.ejs', {url:req.body.url});

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

router.get('/decryptPageJud', function(req, res, next) {
  console.log("get decryptPageJud");
  res.render('decryptPageJud.ejs');
})

router.get('/decryptPageAdmin', function(req, res, next) {
  console.log("get decryptPageAdmin");
  res.render('decryptPageAdmin.ejs');
})

router.post('/decryptPageJud', async function(req, res, next){
  console.log("post decryptPageJud");
  console.log(req.body.url);
  console.log(req.body.privateKey);

  var privateKey = req.body.privateKey;
  var url = req.body.url;

    const publicKey = await EthCrypto.publicKeyByPrivateKey(privateKey);

    var ipfsData = "";
    let qwe = await fetch(url)
      .then(response => response.text())
      .then(text => {
        try {
          ipfsData = text;
            // console.log(text);
        } catch(err) {
          console.log(err);
           // It is text, do you text handling here
        }
      });
      // const temp = JSON.stringify(encrypted);
      // console.log(temp);
      // console.log(encrypted);
      console.log("Judiciary Data");
      console.log(ipfsData);
      const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKey, JSON.parse(ipfsData));
      console.log("decryptMessage in judiciary "+decryptMessage);


  res.send({"success":"success", "decryptMessage":decryptMessage});

})


router.post('/judiciaryData', async function (req, res, next){
  // console.log(req.body.privateKey);
  // console.log(req.body.url);
  console.log("post jud data");
  console.log(req.body.url);
// res.redirect('/decryptPageJud');
res.render('decryptPageJud.ejs', {url:req.body.url});



  // res.send('/decryptPageJud.ejs',{'url':req.body.url});
// res.sendFile(path.join(__dirname+'/decryptPageJud'));
  // var privateKey = req.body.privateKey;
  // var url = req.body.url;
  //
  //   const publicKey = await EthCrypto.publicKeyByPrivateKey(privateKey);
  //
  //   var ipfsData = "";
  //   let qwe = await fetch(url)
  //     .then(response => response.text())
  //     .then(text => {
  //       try {
  //         ipfsData = text;
  //           // console.log(text);
  //       } catch(err) {
  //         console.log(err);
  //          // It is text, do you text handling here
  //       }
  //     });
  //     // const temp = JSON.stringify(encrypted);
  //     // console.log(temp);
  //     // console.log(encrypted);
  //     console.log("Judiciary Data");
  //     console.log(ipfsData);
  //     const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKey, JSON.parse(ipfsData));
  //     console.log("decryptMessage in judiciary "+decryptMessage);
  //
  //
  // res.send({"success":"success", "decryptMessage":decryptMessage});
})

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



router.post('/addEmail', async function(req,res,next)
{
  console.log("hi");
  var fileData = req.files.file.data;
  console.log("--------------------------------------------------------");
  console.log(req.body.pvt);

  var privateKey = req.body.pvt;
  // console.log(fileData.toString('utf8'));
  var eml = fileData.toString('utf8');
  emlformat.read(eml, async function(error, data)
  {
      if (error) return console.log(error);
      var timeStamp = data["headers"]["Date"];
      var messageId = data["headers"]["Message-ID"];
      var email = data["from"]["email"];
      console.log("=> "+timeStamp + " " + messageId + " " + email );

      // privateKey = '92f9e4472d62fe3c0f7ebf082b0a8dfb727ee0967dc5b1e3c38608923da8d736';

      //encrypt with private key of user
      const publicKey = await EthCrypto.publicKeyByPrivateKey(privateKey);
      fileData = "Temporary Email Data to be encrypted";
      const encryptedLayerOne = await EthCrypto.encryptWithPublicKey(publicKey, fileData);
      // console.log(encrypted);

      //encrypt with private key of admin
      // const adminPrivateKey = "72d76bdfd8c33cb0a429ffc3abd9ac120da2913eb06328fbf7b0a042b3515e3c";
      // const adminPublicKey = await EthCrypto.publicKeyByPrivateKey(adminPrivateKey);
      const encryptedLayerTwo = encryptedLayerOne;
      // = await EthCrypto.encryptWithPublicKey(adminPublicKey, encryptedLayerOne);
      console.log("encrypted layer two : " + JSON.stringify(encryptedLayerTwo));

      console.log("====================================================================");
      const buf = Buffer.from(JSON.stringify(encryptedLayerTwo), "utf-8");


      const message = encryptedLayerTwo;
  const messageHash = EthCrypto.hash.keccak256(message);
  const signature = EthCrypto.sign(
      '92f9e4472d62fe3c0f7ebf082b0a8dfb727ee0967dc5b1e3c38608923da8d736', // privateKey
      messageHash // hash of message
  );
 console.log("signature : " + signature);
const jsonObject = {"signature" : signature, "encryptedData" : JSON.stringify(encryptedLayerTwo)};
const buf1 = Buffer.from(JSON.stringify(jsonObject), "utf-8");

  const signer = EthCrypto.recover(
     signature,
     EthCrypto.hash.keccak256(message) // signed message hash
 );
console.log("signer : " + signer);

//  const signer1 = EthCrypto.recoverPublicKey(
//      '0xc04b809d8f33c46ff80c44ba58e866ff0d5..', // signature
//      EthCrypto.hash.keccak256('foobar') // message hash
//  );
// console.log(signer1);
  // JSON.stringify({"Data":"data1"}), "utf-8");

      var hash = "null";
      ipfs.files.add(buf1, async (err, result) =>
      {
        if(err)
        {
          console.error(err)
          return
        }
        console.log(result);
        hash = result[0].hash;
        console.log(result[0].hash);
        //in judiciary
          var url =  'https://ipfs.io/ipfs/'+hash;
          console.log(url);
          var ipfsData = "";
          let qwe = await fetch(url)
            .then(response => response.text())
            .then(text => {
              console.log("in fetch");
              try {
                ipfsData = text;
                  console.log(text);
              } catch(err) {
                console.log(err);
                 // It is text, do you text handling here
              }
          });
        // const temp = JSON.stringify(encrypted);
        // console.log(temp);
        // console.log(encrypted);
        console.log("ipfsDAta");
        console.log(ipfsData);

        const ipfsJson = JSON.parse(ipfsData);

        console.log(ipfsJson.signature);
        const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKey, JSON.parse(ipfsJson.encryptedData));
        console.log("decryptMessage =========================================================="+decryptMessage);
        // url = "url";
        res.send({"success":"Success", "timeStamp":timeStamp,
                  "messageId":messageId, "email":email, "url": url});
    });
  //var url = 'https://ipfs.infura.io:5001/api/v0/object/get?arg='+hash;
//
//   fetch(url).then(response =>
//     response.json().then(data => ({
//         data: data,
//         status: response.status
//     })
// ).then(res => {
//     console.log(res.status, res.data);
//     // console.log(res.data.map(b => String.fromCharCode(b)).join(""));
// }));

  // request.get(url, function (error, response, body) {
  //     if (!error && response.statusCode == 200)
  //     {
  //         var eml = body;
  //         console.log(body);
  //         body.json();
  //         console.log(body.Data);
  //     }
  // });




// Qmc3LfCheSmJw5Y6EzxCNosoawStMxzQnHvxK3uqDGDgV4
// Qmc3LfCheSmJw5Y6EzxCNosoawStMxzQnHvxK3uqDGDgV4
// QmSbC3bS4DH9QQXrxyZygbptuqjkvk7EzEuwa8yLbbxea9

// https://ipfs.infura.io:5001/api/v0/object/get?arg=QmSbC3bS4DH9QQXrxyZygbptuqjkvk7EzEuwa8yLbbxea9
// var url =  'https://ipfs.infura.io:5001/api/v0/object/get?arg='+hash;
// request.get(url, function (error, response, body) {
//     if (!error && response.statusCode == 200)
//     {
//         var eml = body;
//
//     }
// });
//
//        decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKey, encrypted);
      // console.log(decryptMessage);

      // res.send({"success":"Success", "timeStamp":timeStamp,
                // "messageId":messageId, "email":email});
  });//eml parsing

//get pvt key from front encrypted end
//encryption
//ipfs
//send url to front end

  // res.send();
  // res.send({"path":"s"});
  // res.send({"Success" : "success"});
 // const path = __dirname + '/images/' + fileName

//previous ----------------------------------------------
  // var url = req.body.url;
  // var privateKey = req.body.privateKey;
  // console.log(url + " " + privateKey);
// 0xF48017c24fe0513545E25d314fFcc16209fAdA4E

// const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
//
//  const encrypted = await EthCrypto.encryptWithPublicKey(
//         publicKey, // publicKey
//         url // message
//     );
// console.log(encrypted);

    // const message = await EthCrypto.decryptWithPrivateKey(
    //       '92f9e4472d62fe3c0f7ebf082b0a8dfb727ee0967dc5b1e3c38608923da8d736', // privateKey
    //       {
    //           iv: '02aeac54cb45283b427bd1a5028552c1',
    //           ephemPublicKey: '044acf39ed83c304f19f41ea66615d7a6c0068d5fc48ee181f2fb1091...',
    //           ciphertext: '5fbbcc1a44ee19f7499dbc39cfc4ce96',
    //           mac: '96490b293763f49a371d3a2040a2d2cb57f246ee88958009fe3c7ef2a38264a1'
    //       } // encrypted-data
    //   );

 // const address = EthCrypto.publicKey.toAddress(
 //      publicKey
 //  );

 // console.log("address "+address);
// res.send({"success":"Sucsess","timeStamp":"timeStampt", "messageId":"messageIdt", "email":"emailt"});
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

// fs.readFile(fileName, function(err, data) {
//     if (err) {
//       console.log("-----------------------------------------------hii-------------------------------------------------------------");
//       console.log(err);
//       console.log("-----------------------------------------------------------------");
//     }
//     else
//     console.log(data);
// });


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
