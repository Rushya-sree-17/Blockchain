# Email Validation and Arbitration Framework, Platform Based on Blockchain

This project is carried out as a part of Bachelor Dissertation Project, BTech in Computer Science and Engineering, IIT Indore from Jan 2021 to May 2021. This project is a joint work between Atche Sravya, B Rushya Sree Reddy and our project guide Dr. Gourinath banda.


Steps to follow to set up a local environment and run the application :

Step 1 : Clone the following repository
Git repository - https://github.com/Rushya-sree-17/Blockchain

Step 2 : Run npm install to install all the required node module.

Step 3 : Database setup, 
In index.js file :
 
var db_link = "mongodb+srv://USERNAME:PASSWORD@cluster0.xkioe.mongodb.net/Project-0?retryWrites=true&w=majority";

Use your mongoDb credentials in the above link.

Step 5 : Blockchain
Install Ganache - https://www.trufflesuite.com/ganache
Open Ganache app 
Or
Run command : ganache-cli
Make sure to use same ganache port while setting web3
(ex : 	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); )

Step 6 :Remix ide 

Copy Smart contracts code into Remix IDE
Go to Deploy & Run Transactions section and change the environment to Web3 Provider and set the port on which Ganache is running.
Compile the contract and copy the ABI code that is generated
Deploy the contract in the Run & Deploy section and save the contract address.
Paste these ABI code and contract address in contracts.txt file in JSON format and also in index.js file.

To run the server use nodemon server.js

Step 7 : Now visit http://localhost:3000/  to see the UI of code.
