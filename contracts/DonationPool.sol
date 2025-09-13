// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./VerificationRegistry.sol"; // Import the VerificationRegistry contract

contract DonationPool {
    address public owner;
    VerificationRegistry public verificationRegistry; // Instance of the VerificationRegistry contract

    event DonationReceived(address indexed donor, uint256 amount);
    event AidDistributed(address indexed refugee, uint256 amount);

    uint256 public minAidAmount = 0.001 ether;

    constructor(address _verificationRegistryAddress) {
        owner = msg.sender;
        verificationRegistry = VerificationRegistry(_verificationRegistryAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    receive() external payable {
        emit DonationReceived(msg.sender, msg.value);
    }

    function donate() public payable {
        require(msg.value > 0, "Donation amount must be greater than zero");
        emit DonationReceived(msg.sender, msg.value);
    }

    function distributeAid(address _refugee) public onlyOwner {
        require(verificationRegistry.isVerified(_refugee), "Refugee not verified");
        require(address(this).balance >= minAidAmount, "Insufficient funds in the pool");

        (bool success, ) = _refugee.call{value: minAidAmount}("");
        require(success, "Failed to distribute aid");

        emit AidDistributed(_refugee, minAidAmount);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function setMinAidAmount(uint256 _newAmount) public onlyOwner {
        require(_newAmount > 0, "Minimum aid amount must be greater than zero");
        minAidAmount = _newAmount;
    }
}
