const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');
const ReentrancyAttacker = artifacts.require("./TestContracts/ReentrancyAttacker.sol");



contract("TestReentrancyAttackBySeller", accounts => {

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
  var creator = accounts[1];
  var publisherCollector = accounts[8];
  
  var collectorB = accounts[3];

  var malSeller;
  var collectorA;
  // var collectorA = accounts[2];



  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    partnerMarket = await MorpheusMarket.new(holoNFT.address);
    foreignMarket = await MorpheusMarket.new(holoNFT.address);

    // set and make sure that the publisher is set correctly
    await holoNFT.setPublisherFeeCollector(publisherCollector);
    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisherCollector, "Publisher is not set correctly.");

    var isPartner = await holoNFT.isOperator(foreignMarket.address);
    assert.equal(isPartner, false, "foreignMarket should not be a partner.");

    await holoNFT.setOperator(foreignMarket.address, false);
    var isPartner = await holoNFT.isOperator(foreignMarket.address);
    assert.equal(isPartner, false, "foreignMarket should not be a partner.");

    await holoNFT.setOperator(partnerMarket.address, true);
    var isPartner = await holoNFT.isOperator(partnerMarket.address);
    assert.equal(isPartner, true, "partnerMarket should be a partner.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be a partner.");

  })

  it("set seller to a malicious user", async () => {

    malSeller = await ReentrancyAttacker.new(holoNFT.address,morpheuseMarket.address);
    collectorA = malSeller.address;

  })

  it("publisher mint an nft for CollectorA", async () => {

    let stringSig = "12312312312312312312321312kl3;21";
    let signature = web3.utils.asciiToHex(stringSig);

    let tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, true, signature, publisherFee, { from: publisher });

    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });

    let ownerOfToken = await holoNFT.ownerOf(tokenId)
    let tokenSig = await holoNFT.getTokenSignature(tokenId);
    let tokenSigAccount = String(tokenSig.substring(0, 42)).toLowerCase();
    let tokenSigText = hex_to_ascii(tokenSig.substring(42, tokenSig.length)); // 64 + 42

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(tokenSigAccount, String(creator).toLowerCase(), "Token account should be same account of artist");
    assert.equal(tokenSigText.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo
  })

  it("collectorA put its NFT on sale", async () => {

    sellingPrice = 10000;

    //Publisher put collectorA's NFT on sale
    await malSeller.approve(morpheuseMarket.address,tokenId);
    await malSeller.openTrade(tokenId, sellingPrice);

  })

  it("collectorB buys collectorA's item (with signature)", async () => {

    let stringSig = "I am Batman";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorB;
    let seller = collectorA;

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.executeTrade(tokenId,signature,{from:buyer, value:sellingPrice});
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // checking stakeholders balance

    let sellerAmount = web3.utils.toBN(sellingPrice*(1-((creatorFee+publisherFee)/10000)));
    let publisherAmount = web3.utils.toBN(sellingPrice*(publisherFee/10000));
    let creatorAmount = web3.utils.toBN(sellingPrice*(creatorFee/10000));

    // assert.equal(true,false,"TODO: TRANSACTION SHOULD GO THROUGH and SELLER WITHDRAW CASH AFTERWARD");
    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");
    assert.deepEqual(sellerBalance.toString(), newSellerBalance.toString(), "collectorA Balance balance incorrect");
  
    let marketBalance = web3.utils.toBN(String(await web3.eth.getBalance(morpheuseMarket.address)));
    assert.deepEqual(marketBalance.toString(), sellerAmount.toString(), "contract Balance balance incorrect");

  })

  it("seller withdraw the left over money", async () => {

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(collectorA)));

    await malSeller.claimCredit();

    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(collectorA)));
    let sellerAmount = web3.utils.toBN(sellingPrice*(1-((creatorFee+publisherFee)/10000)));

    assert.deepEqual(sellerBalance.add(sellerAmount).toString(), newSellerBalance.toString(), "creator Balance balance incorrect");
  })



});

function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}