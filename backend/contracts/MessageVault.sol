// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MessageVault {
    event MessageRecorded(
        address indexed sender, 
        address indexed recipient, 
        string cid, 
        uint256 timestamp
    );

    function recordMessage(address recipient, string memory cid) public {
        emit MessageRecorded(msg.sender, recipient, cid, block.timestamp);
    }
}
