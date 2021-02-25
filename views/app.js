Web3 = require('web3');

const web3 = new Web3(window.ethereum);
window.ethereum.enable();

var s = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "content",
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
		"name": "generateTransaction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "temp",
				"type": "uint256"
			}
		],
		"name": "inc",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "transactions",
		"outputs": [
			{
				"internalType": "string",
				"name": "content",
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
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "transactionsCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "x",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const TransactionsContract = web3.eth.contract(s).at("0xD107efB6d9f430aC6C9d1Ac0664C9ce7cFC24974");

function createTransaction() {
  

TransactionsContract.generateTransaction("c1","m1","t1","e1");
// send({from : web3.eth.accounts[0]},function(error,transactionHash){

// });
}



// // Web3 = require('web3');

// // web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// if (typeof web3 !== 'undefined') {
//   web3 = new Web3(web3.currentProvider);
// } else {
//   // set the provider you want from Web3.providers
//   web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
// }

// web3.eth.defaultAccount = web3.eth.accounts[0];

// var TransactionsContract = new web3.eth.contract(
//   [
// 	{
// 		"inputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "constructor"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "string",
// 				"name": "content",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "messageId",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "timeStamp",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "userEmailId",
// 				"type": "string"
// 			}
// 		],
// 		"name": "generateTransaction",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "temp",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "inc",
// 		"outputs": [],
// 		"stateMutability": "nonpayable",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"name": "transactions",
// 		"outputs": [
// 			{
// 				"internalType": "string",
// 				"name": "content",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "messageId",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "timeStamp",
// 				"type": "string"
// 			},
// 			{
// 				"internalType": "string",
// 				"name": "userEmailId",
// 				"type": "string"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [],
// 		"name": "transactionsCount",
// 		"outputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	},
// 	{
// 		"inputs": [],
// 		"name": "x",
// 		"outputs": [
// 			{
// 				"internalType": "uint256",
// 				"name": "",
// 				"type": "uint256"
// 			}
// 		],
// 		"stateMutability": "view",
// 		"type": "function"
// 	}
// ], '0xD107efB6d9f430aC6C9d1Ac0664C9ce7cFC24974');

// // var temp = TransactionsContract.at('0xD107efB6d9f430aC6C9d1Ac0664C9ce7cFC24974');

// console.log(TransactionsContract);

// createTransaction: {
//   TransactionsContract.methods.generateTransaction($("#content").val(), $("#messageId").val(), $("#timeStamp").val(), $("#emailId").val()).send().then(function (result){
//     console.log(result);
//   });
// }

// // $("#button").click(function() {
// //   await temp.generateTransaction($("#content").val(), $("#messageId").val(), $("#timeStamp").val(), $("#emailId").val());
// // });


// import Web3 from 'web3';

