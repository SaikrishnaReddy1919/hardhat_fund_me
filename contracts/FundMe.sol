// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";

//best practice for error code is : contractName__errorName
error FundMe__NotOwner();

/** @title A contract for crowd funding
 * @author Krishna
 * @notice This contract is to demo a sample funding contract
 * @dev this implements price feeds as our library.
 */

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18; // usd with 18 decimals
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFounded;
    address private immutable i_owner;
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only owner is allowed to call this.");
        // if(msg.sender != owner) revert FundMe__NotOwner();
        _;
    }

    // s_priceFeed : contract address to get the price will be passed dynamically while deploying based on the chain that we deploy.
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    //what happens if someone sends eth to this contract without calling fund function?
    //ex: direclty sending eth to the contract address - then fund() will not be executed so
    // solidity has some special functions like recieve and fallback - these are executed when funds are sent to the contract directly.
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        //set min fund amount
        // require(getConversionRate(msg.value) >= minimumUSD , "didn't send enough funds!"); //1e18 = 1 * 10 **18 == 1000000000000000000 -> use without library
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "didn't send enough funds!."
        );

        s_funders.push(msg.sender); // push sender to funded array.
        s_addressToAmountFounded[msg.sender] = msg.value; // keeps track of how much amount sent for each address.
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFounded[funder] = 0;
        }
        //reset array
        s_funders = new address[](0); //blank new array
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
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed.");
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFounded[funder] = 0;
        }
        //reset array
        s_funders = new address[](0); //blank new array
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed.");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAMountFunded(address funder) public view returns (uint256) {
        return s_addressToAmountFounded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
