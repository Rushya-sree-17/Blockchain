
pragma solidity  ^0.5.0;

contract emailTransactions {

 uint public transactionsCount = 0;

 struct Transaction{
     string hash;
     string messageId;
     string timeStamp;
     string userEmailId;
 }

 mapping(uint => Transaction) public transactionsMap;

 function generateTransaction(string memory _hash, string memory _messageId, string memory _timeStamp, string memory _userEmailId) public
 {
     transactionsCount++;
     transactionsMap[transactionsCount] = Transaction(_hash, _messageId, _timeStamp, _userEmailId);
 }

 function getEmailTransactionCount() public view returns (uint){
     return transactionsCount;
 }

 function getTransaction(uint transCount) public view returns (string memory , string memory, string memory, string memory ) {
   return (transactionsMap[transCount].hash, transactionsMap[transCount].messageId,
                    transactionsMap[transCount].timeStamp, transactionsMap[transCount].userEmailId);
 }


}
