const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

contract("TestSetMarketOperators", (accounts) => {
  const TRADE_STATUS_CLOSE = 0;
  const TRADE_STATUS_SELLING = 1;

  var holoNFT;
  var morpheusMarket;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var publisherFeeFirstSale = 2000; // 20.00%
  var sellingPrice = "0.25"; //Eth
  var allowSignature = true;
  let stringSig = "test";
  let creatorSignature = web3.utils.asciiToHex(stringSig);

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var collectorB = accounts[3];
  var opearator = accounts[5];

  it("Setup HoloNFT and Morpheus market", async () => {
    holoNFT = await HoloNFT.deployed();
    morpheusMarket = await MorpheusMarket.deployed();

    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(
      publisherAddress,
      publisher,
      "Publisher is not set correctly."
    );

    await holoNFT.setOperator(morpheusMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheusMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be an operator.");

    await holoNFT.setOperator(opearator, true);
    var isPartner = await holoNFT.isOperator(opearator);
    assert.equal(isPartner, true, "Opearator market should be an operator.");
  });

  it("NFT Drop for CollectorA: Sign by the publisher", async () => {

    let buyerSignature = web3.utils.asciiToHex("test2");
    // Prepare hash and sign it
    var hashData = hashNFTDrop(
      collectorA,
      tokenId,
      creator,
      creatorFee,
      allowSignature,
      creatorSignature,
      publisherFee
    );
    var signature = await web3.eth.sign(hashData, publisher);
    signature =
      signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await morpheusMarket.redeemHoloNFTDrop(
      collectorA,
      tokenId,
      creator,
      creatorFee,
      allowSignature,
      creatorSignature,
      buyerSignature,
      publisherFee,
      signature,
      { from: collectorA }
    );

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(
      ownerOfToken,
      collectorA,
      "Target owner should be the owner of this token id"
    ); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  });

  it("collectorA put its NFT for sale at 0.25 eth", async () => {
    sellingPrice = "0.25"; //Eth

    //Publisher put collectorA's NFT on sale
    await holoNFT.approve(morpheusMarket.address, tokenId, {
      from: collectorA,
    });
    let tx = await morpheusMarket.openTrade(
      tokenId,
      web3.utils.toWei(sellingPrice, "ether"),
      { from: collectorA }
    );
    truffleAssert.eventEmitted(tx, "TradeStatusChange", {
      tokenId: web3.utils.toBN(tokenId),
      status: web3.utils.toBN(TRADE_STATUS_SELLING),
      price: web3.utils.toBN(web3.utils.toWei(sellingPrice, "ether")),
    });
  });

  
  it("Get trade status", async () => {

    let tokenStatus = await morpheusMarket.getTrade(tokenId);

    assert.equal(tokenStatus[0].toString(), 1, "Status should be 1");
    assert.equal(tokenStatus[1].toString(), web3.utils.toBN(web3.utils.toWei(sellingPrice, "ether")), "Token price  should be same");
    
  });

  it("collectorB buys collectorA's item (with signature)", async () => {

    let stringSig = "Go to the moon";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorB;
    let seller = collectorA;

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheusMarket.executeTrade(tokenId, signature, {from:buyer, value:web3.utils.toWei(sellingPrice, 'ether')});
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // checking stakeholders balance
    let sellerAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - ((creatorFee + publisherFee) / 10000)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFee/10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (creatorFee/10000));

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
    assert.equal(signatureWord.localeCompare("test"), 0, "Token memo should be same memo that artist send"); // check token memo
    
    // second user
    let secondUserSig = String(tokenSignature.substring(106, 210)).toLowerCase();
    tokenSignatureAccount = "0x"+String(secondUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = secondUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
        
    assert.equal(tokenSignatureAccount, String(collectorA).toLowerCase(), "Token account should be same account of buyer");
    assert.equal(signatureWord.localeCompare("test2"), 0, "Token memo should be same memo that buyer send"); // check token memo*/
  })


  it("collectorB put its NFT for sale at 0.25 eth (token id 2)", async () => {
    sellingPrice = "0.3"; //Eth

    //Publisher put collectorB's NFT on sale
    await holoNFT.approve(morpheusMarket.address, tokenId, {
      from: collectorB,
    });
    let tx = await morpheusMarket.openTrade(
      tokenId,
      web3.utils.toWei(sellingPrice, "ether"),
      { from: collectorB }
    );
    truffleAssert.eventEmitted(tx, "TradeStatusChange", {
      tokenId: web3.utils.toBN(tokenId),
      status: web3.utils.toBN(TRADE_STATUS_SELLING),
      price: web3.utils.toBN(web3.utils.toWei(sellingPrice, "ether")),
    });
  });

  it("collectorB cancle NFT for sale", async () => {

    await holoNFT.approve(morpheusMarket.address, tokenId, {
      from: collectorB,
    });
    let tx = await morpheusMarket.cancelTrade(
      tokenId,
      { from: collectorB }
    );
    truffleAssert.eventEmitted(tx, "TradeStatusChange", {
      tokenId: web3.utils.toBN(tokenId),
      status: web3.utils.toBN(TRADE_STATUS_CLOSE),
    });
  });

  it("Set Morpheus market to non operator", async () => {
    await holoNFT.setOperator(morpheusMarket.address, false);
    var isPartner = await holoNFT.isOperator(morpheusMarket.address);
    assert.equal(
      isPartner,
      false,
      "Morpheus market should not be an operator."
    );
  });

  it("NFT Drop for CollectorA: Sign by the publisher", async () => {
    tokenId++;
    let buyerSignature = web3.utils.asciiToHex("test");

    // Prepare hash and sign it
    var hashData = hashNFTDrop(
      collectorA,
      tokenId,
      creator,
      creatorFee,
      allowSignature,
      creatorSignature,
      publisherFee
    );
    var signature = await web3.eth.sign(hashData, publisher);
    signature =
      signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(
      morpheusMarket.redeemHoloNFTDrop(
        collectorA,
        tokenId,
        creator,
        creatorFee,
        allowSignature,
        creatorSignature,
        buyerSignature,
        publisherFee,
        signature,
        { from: collectorA }
      ),
      "HoloNFT: Sender is not a partner market nor an owner."
    );
  });

});

function hashNFTDrop(
  toAccount,
  tokenId,
  creatorAccount,
  creatorFee,
  allowSignature,
  creatorSignature,
  publisherFee
) {
  return web3.utils.soliditySha3(
    { t: "address", v: toAccount },
    { t: "uint256", v: tokenId },
    { t: "address", v: creatorAccount },
    { t: "uint16", v: creatorFee },
    { t: "bool", v: allowSignature },
    { t: "bytes32", v: creatorSignature },
    { t: "uint16", v: publisherFee }
  );
}

function hashNFTPresale(
  sellingPrice,
  tokenId,
  creatorAccount,
  creatorFee,
  allowSignature,
  creatorSignature,
  publisherFee,
  publisherFeeFirstSale
) {
  return web3.utils.soliditySha3(
    { t: "uint248", v: sellingPrice },
    { t: "uint256", v: tokenId },
    { t: "address", v: creatorAccount },
    { t: "uint16", v: creatorFee },
    { t: "bool", v: allowSignature },
    { t: "bytes32", v: creatorSignature },
    { t: "uint16", v: publisherFee },
    { t: "uint16", v: publisherFeeFirstSale }
  );
}

function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}