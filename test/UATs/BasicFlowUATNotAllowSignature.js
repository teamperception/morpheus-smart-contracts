const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE

contract("BasicFlowUATNotAllowSignature", accounts => {

  const TRADE_STATUS_CLOSE = 0;
  const TRADE_STATUS_SELLING = 1;

  var holoNFT;
  var morpheuseMarket;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var sellingPrice;

  var publisher = accounts[0];
  var publisherCollector = accounts[8];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var collectorB = accounts[3];
  var partnerMarket;
  var foreignMarket;
  
  var isAllowSignature = false;

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

  it("The publisher mint an nft for CollectorA", async () => {

    let stringSig = "12312312312312312312321312kl3;21";
    let signature = web3.utils.asciiToHex(stringSig);

    let tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, isAllowSignature, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });

    let ownerOfToken = await holoNFT.ownerOf(tokenId)
    let tokenSig = await holoNFT.getTokenSignature(tokenId);
    let tokenSigAccount = String(tokenSig.substring(0, 42)).toLowerCase();
    let tokenSigText = hex_to_ascii(tokenSig.substring(42, tokenSig.length)); // 64 + 42

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(tokenSigAccount, String(creator).toLowerCase(), "Token account should be same account of artist");
    assert.equal(tokenSigText.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo
  })

  it("CollectorA put its own NFT for sale", async () => {

    sellingPrice = 200;
    await holoNFT.approve(morpheuseMarket.address,tokenId, {from: collectorA});
    let tx = await morpheuseMarket.openTrade(tokenId, sellingPrice, { from: collectorA });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(sellingPrice) });

  })

  it("CollectorB buys and sign collectorA's item", async () => {

    let stringSig = "I am Batman";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorB;
    let seller = collectorA;

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    let tx = await morpheuseMarket.executeTrade(tokenId,signature,{from:buyer, value:sellingPrice});
    
    let ownerOfToken = await holoNFT.ownerOf(tokenId)
    assert.equal(ownerOfToken, buyer, "Target owner should be the owner of this token id"); // targetOwner receive tokenID

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