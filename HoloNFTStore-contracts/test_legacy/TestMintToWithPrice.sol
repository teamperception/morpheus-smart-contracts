// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/HoloNFT.sol";

contract TestMintToWithPrice {

    HoloNFT holoNFT;
    uint256 tokenId;
    string tokenURI;
    uint256 creatorFee;
    bytes32 memo;
    uint256 price;

    function beforeEach() public {
        // setup parameters here
        holoNFT = new HoloNFT();
        tokenId = 3;
        tokenURI = "a0c9e0a1b53de46394a24ed609e5dba9ec94bd67943125b0b43590b5ac717c45";
        creatorFee = 10;
        memo = 'Hello I am Art';
        price = 1000000000000000000; //or 1e18 == 1eth

        holoNFT.mintTo(msg.sender, tokenId, tokenURI, msg.sender, creatorFee, price, "");
    }
    
    function testGetTokenPrice() public
    {
        Assert.equal(holoNFT.getTokenPrice(tokenId), price, "getTokenPrice and price should be the same");
    }


}
