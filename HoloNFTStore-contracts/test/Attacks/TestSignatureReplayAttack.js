const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

contract("TestSignatureReplayAttack", accounts => {

  const TRADE_STATUS_CLOSE = 0;
  const TRADE_STATUS_SELLING = 1;
  const TRADE_STATUS_SOLD = 2;

  var holoNFT;
  var morpheuseMarket;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var publisherFeeFirstSale = 2000; // 20.00%
  var sellingPrice = 1000;
  var allowSignature = false;
  let stringSig = "12312312312312312312321312kl3;21";
  let creatorSignature = web3.utils.asciiToHex(stringSig);

  var publisher = accounts[0];
  var publisherCollector = accounts[8];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var collectorB = accounts[3];

  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    // set and make sure that the publisher is set correctly
    await holoNFT.setPublisherFeeCollector(publisherCollector);
    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisherCollector, "Publisher is not set correctly.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be a partner.");
    
  })


  it("Redeem a free NFT Drop for Collector A", async () => {

    morpheuseMarket = await MorpheusMarket.deployed();
    holoNFT = await HoloNFT.deployed();

    let buyerSignature = web3.utils.asciiToHex("test");

    var hashData = hashNFTDrop(collectorA, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee);

    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, {from:collectorA});

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");

  })

  it("Attack: Redeem a free NFT Drop for Collector A second time", async () => {

    morpheuseMarket = await MorpheusMarket.deployed();
    holoNFT = await HoloNFT.deployed();

    var hashData = hashNFTDrop(collectorA, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee);

    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee, signature, {from:collectorA});
      assert.equal(true, false,"A user should not be able to redeem the same NFT twice");
    } catch (e) {
      assert.equal(true, true);
    }
  })

  it("Lazy Mint NFT for Sale", async () => {

    tokenId = 2;

    morpheuseMarket = await MorpheusMarket.deployed();
    holoNFT = await HoloNFT.deployed();

    var hashData = hashNFTPresale(sellingPrice, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee,publisherFeeFirstSale);

    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    let buyerSignature = web3.utils.asciiToHex("test");

    let tx = await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, {from:collectorA, value: 1000});

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));  

    let publisherAmount = web3.utils.toBN(sellingPrice*(publisherFeeFirstSale/10000));
    let creatorAmount = web3.utils.toBN(sellingPrice*(1-(publisherFeeFirstSale/10000))); 

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");
    

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");

  })

  it("Attack: Lazy Mint NFT for Sale for second time", async () => {

    tokenId = 2;

    morpheuseMarket = await MorpheusMarket.deployed();
    holoNFT = await HoloNFT.deployed();

    var hashData = hashNFTPresale(sellingPrice, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee,publisherFeeFirstSale);

    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
      await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee,publisherFeeFirstSale, signature, {from:collectorA, value: 1000});
      assert.equal(true, false,"A user should not be able to purchase adn mint the same NFT twice");
    } catch (e) {
      assert.equal(true, true);
    }

  })


});

function hashNFTPresale(sellingPrice, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee,publisherFeeFirstSale) {
  return web3.utils.soliditySha3(
    {t: 'uint248', v:sellingPrice},
    {t: 'uint256', v: tokenId}, 
    {t: 'address', v:creatorAccount},
    {t: 'uint16', v:creatorFee},
    {t: 'bool', v:allowSignature},
    {t: 'bytes32', v:creatorSignature},
    {t: 'uint16', v:publisherFee},
    {t: 'uint16', v:publisherFeeFirstSale});
  }


function hashNFTDrop(toAccount, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee) {
  return web3.utils.soliditySha3(
    {t: 'address', v:toAccount},
    {t: 'uint256', v: tokenId}, 
    {t: 'address', v:creatorAccount},
    {t: 'uint16', v:creatorFee},
    {t: 'bool', v:allowSignature},
    {t: 'bytes32', v:creatorSignature},
    {t: 'uint16', v:publisherFee});
  }