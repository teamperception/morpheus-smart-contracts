const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE

contract("BasicFlowUAT", accounts => {

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

  it("Publisher can not put CollectorA's NFT on sale", async () => {

    let sellingPrice = 10;
    await truffleAssert.reverts(morpheuseMarket.openTrade(tokenId, sellingPrice, { from: publisher }));

  })

  it("CollectorA put its own NFT for sale", async () => {

    let sellingPrice = 200;
    let tx = await morpheuseMarket.openTrade(tokenId, sellingPrice, { from: collectorA });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(sellingPrice) });

  })

  it("CollectorA change the listing price for the NFT", async () => {

    let sellingPrice = 10000;
    let tx = await morpheuseMarket.openTrade(tokenId, sellingPrice, { from: collectorA });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(sellingPrice) });

  })

  it("CollectorA stop selling its NFT", async () => {

    let tx = await morpheuseMarket.cancelTrade(tokenId, { from: collectorA });
    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_CLOSE), price: web3.utils.toBN(0) });

  })

  it("collecotB cannot buy collectorA's NFT because it is no longer for sale", async () => {

    let stringSig = "I am Batman";
    let signature = web3.utils.asciiToHex(stringSig);
    await truffleAssert.reverts(morpheuseMarket.executeTrade(tokenId,signature,{from:collectorB, value:1}));

  })

  it("CollectorA set put its NFT on sale again on Morpheus market", async () => {

    sellingPrice = 10000;
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
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // checking stakeholders balance

    let sellerAmount = web3.utils.toBN(sellingPrice*(1-((creatorFee+publisherFee)/10000)));
    let publisherAmount = web3.utils.toBN(sellingPrice*(publisherFee/10000));
    let creatorAmount = web3.utils.toBN(sellingPrice*(creatorFee/10000));

    assert.deepEqual(sellerBalance.add(sellerAmount).toString(), newSellerBalance.toString(), "collectorA Balance balance incorrect");
    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    // checking signatures (42 + 32 = 74)
    let tokenSignature = await holoNFT.getTokenSignature(tokenId);

    // first user
    let firstUserSig = String(tokenSignature.substring(0, 106)).toLowerCase();
    let tokenSignatureAccount = String(firstUserSig.substring(0, 42)).toLowerCase();
    let tokenSignatureWord = firstUserSig.substring(42); // 106 = 42 + 64
    let signatureWord = hex_to_ascii(tokenSignatureWord);
    
    assert.equal(tokenSignatureAccount, String(creator).toLowerCase(), "Token account should be same account of artist");
    assert.equal(signatureWord.localeCompare("12312312312312312312321312kl3;21"), 0, "Token memo should be same memo that artist send"); // check token memo

    let secondUserSig = String(tokenSignature.substring(106, 210)).toLowerCase();
    tokenSignatureAccount = "0x"+String(secondUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = secondUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
    
    assert.equal(tokenSignatureAccount, String(collectorB).toLowerCase(), "Token account should be same account of artist");
    assert.equal(signatureWord.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo

  })

  it("collectorB put the NFT on sale on a partner market", async () => {

    sellingPrice = 15000;
    await holoNFT.approve(partnerMarket.address,tokenId, {from: collectorB});
    let tx = await partnerMarket.openTrade(tokenId, sellingPrice, { from: collectorB });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(sellingPrice) });
    
  })

  it("CollectorA buy and sign the NFT from collectorA at the partner market", async () => {

    let stringSig = "I am spiderman";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorA;
    let seller = collectorB;

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await partnerMarket.executeTrade(tokenId,signature,{from:buyer, value:sellingPrice});
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // web3.utils.toBN(String(sellerBalance));
    let sellerAmount = web3.utils.toBN(sellingPrice*(1-((creatorFee+publisherFee)/10000)));
    let publisherAmount = web3.utils.toBN(sellingPrice*(publisherFee/10000));
    let creatorAmount = web3.utils.toBN(sellingPrice*(creatorFee/10000));

    assert.deepEqual(sellerBalance.add(sellerAmount).toString(), newSellerBalance.toString(), "collectorA Balance balance incorrect");
    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");
    
  })

  it("CollectorA put the NFT on sale at a foreign market", async () => {

    sellingPrice = 1000;
    await holoNFT.approve(foreignMarket.address,tokenId, {from: collectorA});
    let tx = await foreignMarket.openTrade(tokenId, sellingPrice, { from: collectorA });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(sellingPrice) });

  })

  it("CollectorB can not buy and sign the NFT at the foreign market.", async () => {

    let stringSig = "I am spiderman";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorB;
    
    await truffleAssert.reverts(foreignMarket.executeTrade(tokenId,signature,{from:buyer, value:sellingPrice}));

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