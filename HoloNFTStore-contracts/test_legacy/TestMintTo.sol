// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/HoloNFT.sol";

contract TestMintTo {

    HoloNFT holoNFT;
    uint256 tokenId;
    string tokenURI;
    uint256 creatorFee;
    bytes32 memo;
    uint256 price;
    string baseURI;

    function beforeEach() public {
        // setup parameters here
        holoNFT = new HoloNFT();
        tokenId = 1;
        tokenURI = "a0c9e0a1b53de46394a24ed609e5dba9ec94bd67943125b0b43590b5ac717c45";
        creatorFee = 10;
        price = 1000000000000000000; //or 1e18 == 1eth
        baseURI = "http://www.test.com/";
        memo = "";

        holoNFT.mintTo(msg.sender, tokenId, tokenURI, msg.sender, creatorFee, 0,memo);
    }

    function testGetTokenCreatorFee() public
    {
        Assert.equal(holoNFT.getTokenCreatorFee(tokenId), creatorFee, "getTokenCreatorFee and creatorFee should be the same");
    }
    
    function testGetTokenCreator() public
    {
        Assert.equal(holoNFT.getTokenCreator(tokenId), msg.sender, "getTokenCreator and account owner should be the same");
    }

    function testSetTokenPrice() public
    {
        holoNFT.setTokenPrice(tokenId, price);

        Assert.equal(holoNFT.getTokenPrice(tokenId), price, "getTokenPrice and price should be the same");
    }

    function testsetBaseURI() public
    {
        holoNFT.setBaseURI(baseURI);

        Assert.equal(holoNFT.baseURI(), baseURI, "getTokenCreator and account owner should be the same");

    }
}
