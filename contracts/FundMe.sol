//get funds from users
//withdraw funds
//set a mini funding value in usd


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";
contract FundMe {

    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18; // usd with 18 decimals
    address[] public funders;
    mapping(address => uint256) public addressToAmountFounded;
    address public  /* immutable */ owner;

    AggregatorV3Interface public priceFeed;

    // priceFeed : contract address to get the price will be passed dynamically while deploying based on the chain that we deploy.
    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        //set min fund amount
        // require(getConversionRate(msg.value) >= minimumUSD , "didn't send enough funds!"); //1e18 = 1 * 10 **18 == 1000000000000000000 -> use without library
        require(msg.value.getConversionRate(priceFeed) >= MINIMUM_USD, "didn't send enough funds!.");

        funders.push(msg.sender); // push sender to funded array.
        addressToAmountFounded[msg.sender] = msg.value; // keeps track of how much amount sent for each address.
    }

    function withdraw() public onlyOwner {
         for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++){
             address funder = funders[funderIndex];
             addressToAmountFounded[funder] = 0;
         }
         //reset array 
         funders = new address[](0); //blank new array
         //withdraw 
         //three diff ways : transfer(throws error), send(return bool), call(return bool)

         // transfer : transfer automatically reverts if transfer failes and it uses 2300gas. IF used more txn fails
         //msg.sender = address
         //payable(msg.sender) = payable address
        //  payable(msg.sender).transfer(address(this).balance);

         //send : require is needed to check whether send is success or not. Send returns bool and it also uses 2300gas
        //  bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //  require(sendSuccess, "Send failed.");

         //call :
         (bool callSuccess,) = payable(msg.sender).call{value : address(this).balance}("");
         require(callSuccess, "Call failed.");
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner is allowed to call this.");
        _;
    }

    //what happens if someone sends eth to this contract without calling fund function?
    //ex: direclty sending eth to the contract address - then fund() will not be executed so
    // solidity has some special functions like recieve and fallback - these are executed when funds are sent to the contract directly.

    receive() external payable{
        fund();
    }
    fallback() external payable {
        fund();
    }
}