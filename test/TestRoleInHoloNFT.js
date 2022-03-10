const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

contract("HoloNFTMintTo", accounts => {

    var publisher = accounts[0];
    var creator = accounts[1];
    var collectorA = accounts[2];
    var publisherFeeCollector = accounts[4];

    var tokenId = 1;
    var creatorFee = 250; // 2.5%
    var publisherFee = 750; // 7.5%
    var publisherFeeFirstSale = 2000; // 20.00%
    var sellingPrice = 1000;
    var allowSignature = true;
    let stringSig = "12312312312312312312321312kl3;21";
    let creatorSignature = web3.utils.asciiToHex(stringSig);
    let stringSigBuyer = "Buyer";
    let buyerSignature = web3.utils.asciiToHex(stringSigBuyer);

    it("setup HoloNFT with publisher market and partner market", async () => {

        holoNFT = await HoloNFT.deployed();
        morpheuseMarket = await MorpheusMarket.deployed();
    
        // set and make sure that the publisherFeeCollector is set correctly
        await holoNFT.setPublisherFeeCollector(publisherFeeCollector);
        var publisherFeeCollectorAddress = await holoNFT.getPublisherFeeCollectorAddress();
        assert.equal(publisherFeeCollectorAddress, publisherFeeCollector, "publisherFeeCollector is not set correctly.");
    
        //set and make sure that the market operator is set correctly
        await holoNFT.setOperator(morpheuseMarket.address, true);
        var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
        assert.equal(isPartner, true, "Morpheus market should be a partner.");

        // set and make sure that the publisher is set correctly
        var publisherAddress = await holoNFT.owner();
        assert.equal(publisherAddress, publisher, "Publisher is not set correctly.");

        //set and make sure that the market operator is set correctly
        await holoNFT.setOperator(accounts[5], true);
        var isPartner = await holoNFT.isOperator(accounts[5]);
        assert.equal(isPartner, true, "accounts[5] should be a partner.");
    })


    it("Buy lazy mint NFT: Sign by the publisher", async () => {

        tokenId = 1;
    
        // Prepare hash and sign it
        var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
        var signature = await web3.eth.sign(hashData, publisher);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
        let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherFeeCollector)));
        let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    
        await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 });
        await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
    
        let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherFeeCollector)));
        let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
        let publisherAmount = web3.utils.toBN(sellingPrice * (publisherFeeFirstSale / 10000));
        let creatorAmount = web3.utils.toBN(sellingPrice * (1 - (publisherFeeFirstSale / 10000)));
    
        assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
        assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");
    
        let isTokenExist = await holoNFT.isTokenExist(tokenId);
        let ownerOfToken = await holoNFT.ownerOf(tokenId);
    
        assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
        assert.equal(isTokenExist, true, "Token should be exist");
    })

    it("Buy lazy mint NFT: Sign by an operator", async () => {

        tokenId++;
    
        // Prepare hash and sign it
        var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
        var signature = await web3.eth.sign(hashData, accounts[5]);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
        let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherFeeCollector)));
        let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    
        await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 });
        await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
    
        let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherFeeCollector)));
        let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
        let publisherAmount = web3.utils.toBN(sellingPrice * (publisherFeeFirstSale / 10000));
        let creatorAmount = web3.utils.toBN(sellingPrice * (1 - (publisherFeeFirstSale / 10000)));
    
        assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
        assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");
    
        let isTokenExist = await holoNFT.isTokenExist(tokenId);
        let ownerOfToken = await holoNFT.ownerOf(tokenId);
    
        assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
        assert.equal(isTokenExist, true, "Token should be exist");
    
      })

});

async function validateToken(owner, tokenId, creator, creatorFee, allowSig, publisherFee) {
    let holoNFT = await HoloNFT.deployed();
  
    let tokenOwner = await holoNFT.ownerOf(tokenId)
    let tokenCreator = await holoNFT.getCreatorAddress(tokenId);
    let tokenCreatorFee = await holoNFT.getCreatorFee(tokenId);
    let tokenIsAllowSig = await holoNFT.isAllowSignature(tokenId);
    let tokenSignature = await holoNFT.getTokenSignature(tokenId);
    let tokenPublisherFee = await holoNFT.getPublisherFee(tokenId);
  
    assert.equal(tokenOwner, owner, "Incorrect: tokenOwner");
    assert.equal(tokenCreator, creator, "Incorrect: tokenCreator");
    assert.equal(tokenCreatorFee, creatorFee, "Incorrect: tokenCreatorFee");
    assert.equal(tokenIsAllowSig, allowSig, "Incorrect: tokenIsAllowSig");
    assert.equal(tokenPublisherFee, publisherFee, "Incorrect: tokenPublisherFee");
  
  }

function hashNFTPresale(sellingPrice, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale) {
    return web3.utils.soliditySha3(
      { t: 'uint248', v: sellingPrice },
      { t: 'uint256', v: tokenId },
      { t: 'address', v: creatorAccount },
      { t: 'uint16', v: creatorFee },
      { t: 'bool', v: allowSignature },
      { t: 'bytes32', v: creatorSignature },
      { t: 'uint16', v: publisherFee },
      { t: 'uint16', v: publisherFeeFirstSale });
  }

