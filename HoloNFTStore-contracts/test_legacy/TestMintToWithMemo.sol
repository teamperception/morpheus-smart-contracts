// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/HoloNFT.sol";

contract TestMintToWithMemo {

    HoloNFT holoNFT;
    uint256 tokenId;
    string tokenURI;
    uint256 creatorFee;
    bytes32 memo;

    function beforeEach() public {
        // setup parameters here
        holoNFT = new HoloNFT();
        tokenId = 2;
        tokenURI = "a0c9e0a1b53de46394a24ed609e5dba9ec94bd67943125b0b43590b5ac717c45";
        creatorFee = 10;
        memo = "Hello World";

        holoNFT.mintTo(msg.sender, tokenId, tokenURI, msg.sender, creatorFee, 0, memo);
    }

    // function testGetTokenMemo() public
    // {
    //     bytes memory memoABI = abi.encodePacked(memo);
    //     Assert.equal(holoNFT.getTokenMemo(tokenId), memoABI, "getTokenMemo and memoABI should be the same");
    // }
}
