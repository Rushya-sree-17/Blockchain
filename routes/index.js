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
var Web3 = require('web3');
const https = require('https');
const crypto = require('crypto');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var randomstring = require("randomstring");
//...
router.use(fileupload(), busboy());

function encrypt(text, password){
  var cipher = crypto.createCipher('aes-256-ctr',password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text, password){
  var decipher = crypto.createDecipher('aes-256-ctr',password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('hex');
  return dec;
}

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

    var emailUniqueId = req.body.uniqueMailId;
    console.log("emailUniqueId");
    console.log(emailUniqueId);
    var adminPrivateKey = req.body.privateKey;
    var url = req.body.url;

      const publicKey = await EthCrypto.publicKeyByPrivateKey(adminPrivateKey);

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
        console.log("Admin Data encryption layer");
        console.log(ipfsData);


        const ipfsJson = JSON.parse(ipfsData);
        console.log(ipfsJson);

        const decryptDataAdminLayer = await EthCrypto.decryptWithPrivateKey(adminPrivateKey, (ipfsJson));
        console.log("decryptDataAdminLayer ------------------- "  + (decryptDataAdminLayer) );


        //-----------------------------------------------
        const buf = Buffer.from((decryptDataAdminLayer), "utf-8");

        ipfs.files.add(buf, async (err, result) =>
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



            var statusToBeUpdated = "Mail Sent to judiciary";
            EmailRequest.updateOne({"uniqueMailId" : emailUniqueId},{"status" : statusToBeUpdated,"content":url},function(err){
            	if(err){
            		console.log(err);
            	}else{
            		console.log("Success");
                res.redirect("/profile");
                // res.send("success");
            	}
            });


            // var ipfsData = "";
            // let qwe = await fetch(url)
            //   .then(response => response.text())
            //   .then(text => {
            //     console.log("in fetch");
            //     try {
            //       ipfsData = text;
            //         console.log(text);
            //     } catch(err) {
            //       console.log(err);
            //        // It is text, do you text handling here
            //     }
            // });

            // res.send({"success":"Success", "timeStamp":timeStamp,
                    // "messageId":messageId, "email":email, "url": url});
      });

      // const ipfsJson = JSON.parse(ipfsData);
      // const decryptDataAdminLayer = await EthCrypto.decryptWithPrivateKey(adminPrivateKey, JSON.parse(ipfsJson));
      //
      // // const ipfsJsonUserLayer = JSON.parse(decryptDataAdminLayer);
      // // console.log(ipfsJsonUserLayer.signature);
      // // const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKeyUser, JSON.parse(ipfsJsonUserLayer.encryptedData));
      // console.log("decryptMessage =========================================================="+decryptDataAdminLayer);



});



// router.post('/adminData', async function (req, res, next) {
// 	console.log("req body");
// 	console.log(req.body);
// 	var emailUniqueId = req.body.uniqueMailId;
// 	var content = req.body.emailContent; // url
// console.log("hii");
// return res.render('decryptPageAdmin.ejs', {url:content});
// //
// // 	var statusToBeUpdated = "Mail Sent to judiciary";
// // console.log(emailUniqueId);
// // if(content === "Invalid request")
// // {
// // 	statusToBeUpdated = "Invalid request";
// // }
// // EmailRequest.updateOne({"uniqueMailId" : emailUniqueId},{"status" : statusToBeUpdated,"content":content},function(err){
// // 	if(err){
// // 		console.log(err);
// // 	}else{
// // 		console.log("Success");
// // 	}
// // });
//
// });


router.post('/adminData', async function (req, res, next){
  // console.log(req.body.privateKey);
  // console.log(req.body.url);
  console.log("post admin data");
  console.log(req.body.emailContent);
  console.log(req.body.timeStamp);
  console.log(req.body.messageId);
// res.redirect('/decryptPageJud');
var msgId = req.body.messageId;
var timeStamp = req.body.timeStamp;
var uniqueMailId = req.body.uniqueMailId;

// console.log("hiiiiiiiiiiiiiii " + timeStamp);
// ethereum.enable();
if (typeof web3 !== "undefined")
{
  web3 = new Web3(web3.currentProvider);
}
else
{
// set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// var Courses =  new web3.eth.Contract((contractDetails[0]), (contractDetails[1]) );



var Courses =  new web3.eth.Contract(
[
	{
		"constant": false,
		"inputs": [
			{
				"internalType": "string",
				"name": "_hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_messageId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_timeStamp",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_userEmailId",
				"type": "string"
			}
		],
		"name": "generateTransaction",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transCount",
				"type": "uint256"
			}
		],
		"name": "getTransaction",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "transactionsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "transactionsMap",
		"outputs": [
			{
				"internalType": "string",
				"name": "hash",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "messageId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "timeStamp",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "userEmailId",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
],   "0x8E04c4DE2dFA29cA8Ef2F8E90B7c7cb84391Fc08" );
var hash = "not set";
console.log("Msg id : " + msgId + " ||||| timeStamp : " + timeStamp);

var accounts = await web3.eth.getAccounts(async (error,result) => {
  // console.log(result);
       if (error)
       {
         console.log(error);
       }
       else
       {

         // var transCount = web3.eth.getTransactionCount(web3.eth.defaultAccount, async function(err, counts){
         console.log("result 0 : ");
         // console.log(result[0]);

         var transCount = await web3.eth.getTransactionCount(result[0], async function(err, counts){
           if(!err)
           {
             var flag = 0;
             for( var i = 1; i<counts; i++)
             {
               Courses.methods.getTransaction(i)
               .call({from: result[0]},
                 async function(error, emailTransaction)
                 {
                     if(!error)
                     {
                       if(emailTransaction[1] === msgId && emailTransaction[2] === timeStamp)
                       {
                         // console.log(emailTransaction);
                            flag = 1;
                            // console.log("flag " + flag);
                            // content = emailTransaction[0]; //content here is hash value
                            hash = emailTransaction[0];

                            // break;
                            console.log(i + " * " + counts);
                            if(i === counts )
                            {
                              console.log("hiiiiii " + i);
                                if(flag === 0)
                                {
                                  hash = "Invalid request";
                                  console.log("not  found");
                                }
                                console.log("Email transaction found with hash : " + hash);
                                console.log(hash);
                                console.log(msgId);
                                res.render('decryptPageAdmin.ejs', {url:hash, uniqueMailId:uniqueMailId});
                            }
                       }
                     }
                     else
                     {console.log(error);}
                 });//get method
                 // console.log(i + " - " + flag);
             }
           }
           else
            {console.log(err);}
         });

       }
});
console.log("URL IPFS = " + hash);

// res.render('decryptPageAdmin.ejs', {url:hash});

console.log("hii");

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
  var publicKey;

try {
   publicKey = await EthCrypto.publicKeyByPrivateKey(privateKey);
} catch (e) {
  console.log(e);
  res.send("Incorrect Private Key");
} finally {

}


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
      var ipfsJson = JSON.parse(ipfsData);
      const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKey, ipfsJson.encryptedData);
      console.log("decryptMessage in judiciary "+decryptMessage);

       publicKey = EthCrypto.publicKeyByPrivateKey(privateKey);
       var address = EthCrypto.publicKey.toAddress(publicKey);

      var signer = EthCrypto.recover(
         ipfsJson.signature,
         EthCrypto.hash.keccak256(ipfsJson.encryptedData) // signed message hash
     );
    console.log("signer : " + signer);
    var validation = "Corrupted Email";
    if(address === signer)
    {
      validation = "Validation Successful";
    }
  res.render("validationPage.ejs",{"success":"success", "decryptMessage":decryptMessage,
                "signer":signer, "address":address, "validation":validation});

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
			// console.log("Success");
			res.redirect("/profile");
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

  var privateKeyUser = req.body.pvt;
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

      //encrypt with public key of user - Layer 1
      const publicKeyUser = await EthCrypto.publicKeyByPrivateKey(privateKeyUser);
      // fileData = "Temporary Email Data to be encrypted";
      console.log(fileData);
      const encryptedLayerOne = await EthCrypto.encryptWithPublicKey(publicKeyUser, fileData);

      const decryptDataAdminLayer1 = await EthCrypto.decryptWithPrivateKey(privateKeyUser, (encryptedLayerOne));
      console.log("decryptData user Layer ============================ "  + JSON.stringify(decryptDataAdminLayer1) );


      // console.log(encrypted);

      //Signing by User
      const message = encryptedLayerOne;
      const messageHash = EthCrypto.hash.keccak256(message);
      const signature = EthCrypto.sign(
        privateKeyUser, // privateKey
        messageHash // hash of message
      );

      console.log("signature : " + signature);
      const jsonObjectAfterSigning = {"signature" : signature, "encryptedData" : encryptedLayerOne};

//testing
      const signer = EthCrypto.recover(
         signature,
         EthCrypto.hash.keccak256(message) // signed message hash
     );
    console.log("signer : " + signer);
//testing

      //encrypt with public key of admin
      const adminPrivateKey = "72d76bdfd8c33cb0a429ffc3abd9ac120da2913eb06328fbf7b0a042b3515e3c";
      const adminPublicKey = await EthCrypto.publicKeyByPrivateKey(adminPrivateKey);

console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.log((jsonObjectAfterSigning));
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.log(JSON.stringify(jsonObjectAfterSigning));
      console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

      const encryptedLayerTwo = await EthCrypto.encryptWithPublicKey(adminPublicKey, JSON.stringify(jsonObjectAfterSigning) );

      const decryptDataAdminLayer = await EthCrypto.decryptWithPrivateKey(adminPrivateKey, (encryptedLayerTwo));
      console.log("decryptDataAdminLayer ============================ "  + (decryptDataAdminLayer) );


      console.log("====================================================================");
      const buf = Buffer.from(JSON.stringify(encryptedLayerTwo), "utf-8");




      //encrypt with private key of admin
      // const adminPrivateKey = "72d76bdfd8c33cb0a429ffc3abd9ac120da2913eb06328fbf7b0a042b3515e3c";
      // const adminPublicKey = await EthCrypto.publicKeyByPrivateKey(adminPrivateKey);
      // const encryptedLayerTwo = encryptedLayerOne;
      // = await EthCrypto.encryptWithPublicKey(adminPublicKey, encryptedLayerOne);
      // console.log("encrypted layer two : " + JSON.stringify(encryptedLayerTwo));

      // const buf = Buffer.from(JSON.stringify(encryptedLayerTwo), "utf-8");


      // const message = encryptedLayerTwo;
      // const messageHash = EthCrypto.hash.keccak256(message);
      // const signature = EthCrypto.sign(
      //   '92f9e4472d62fe3c0f7ebf082b0a8dfb727ee0967dc5b1e3c38608923da8d736', // privateKey
      //   messageHash // hash of message
      // );
      // console.log("signature : " + signature);
      // const jsonObject = {"signature" : signature, "encryptedData" : JSON.stringify(encryptedLayerTwo)};
      // const buf1 = Buffer.from(JSON.stringify(jsonObject), "utf-8");



//  const signer1 = EthCrypto.recoverPublicKey(
//      '0xc04b809d8f33c46ff80c44ba58e866ff0d5..', // signature
//      EthCrypto.hash.keccak256('foobar') // message hash
//  );
// console.log(signer1);
  // JSON.stringify({"Data":"data1"}), "utf-8");

      var hash = "null";
      ipfs.files.add(buf, async (err, result) =>
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

        //testing
        console.log("ipfsDAta");
        console.log(ipfsData);
console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&");
        const ipfsJson = JSON.parse(ipfsData);
        console.log(ipfsJson);

        const decryptDataAdminLayer = await EthCrypto.decryptWithPrivateKey(adminPrivateKey, (ipfsJson));
        console.log("decryptDataAdminLayer ------------------- "  + (decryptDataAdminLayer) );

        const encryptedData1 = JSON.parse((decryptDataAdminLayer));

        const decryptDataUserLayer = await EthCrypto.decryptWithPrivateKey(privateKeyUser, encryptedData1.encryptedData);
        console.log("decryptData userLayer ------------------- "  + JSON.stringify(decryptDataUserLayer) );


        // const ipfsJsonUserLayer = JSON.parse(decryptDataAdminLayer);
        // console.log(ipfsJsonUserLayer.signature);
        // const decryptMessage = await EthCrypto.decryptWithPrivateKey(privateKeyUser, JSON.parse(ipfsJsonUserLayer.encryptedData));
        // console.log("decryptMessage =========================================================="+decryptMessage);
        // url = "url";

        //commenting this removes header error
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
