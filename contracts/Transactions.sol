pragma solidity >=0.4.22 <0.9.0;


contract Transactions
{
    uint public transactionsCount = 0;
    
    uint public x = 0;


    constructor() public {
        generateTransaction("Check","check","check","check");
    }

    struct Transaction{
        string content;
        string messageId;
        string timeStamp;
        string userEmailId;
    }
    
    mapping(uint => Transaction) public transactions;

    function inc(uint temp) public
    {
        x = x + temp;
    }

    function generateTransaction(string memory content, string memory messageId, string memory timeStamp, string memory userEmailId) public
    {
        transactionsCount++;
        transactions[transactionsCount] = Transaction(content, messageId, timeStamp, userEmailId);
    }
    
}