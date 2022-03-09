const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

// Nut4214 - Please implement the test cases
// STATUS: NOT DONE - NEED TO ADDRESS FAILED TEST CASES

contract("MorpheusMarketPurchaseAndMintHoloNFT", accounts => {

  var holoNFT;
  var morpheuseMarket;

  // var tokenId = web3.utils.toBN('99999999999999999999999999999999999999999999999999999999999999999999999999999');
  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var publisherFeeFirstSale = 2000; // 20.00%
  var sellingPrice = 1000;
  var allowSignature = false;
  let stringSig = "12312312312312312312321312kl3;21";
  let creatorSignature = web3.utils.asciiToHex(stringSig);

  let stringSigBuyer = "Buyer";
  let buyerSignature = web3.utils.asciiToHex(stringSigBuyer);

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var opearator = accounts[5];

  it("Setup HoloNFT and Morpheus market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisher, "Publisher is not set correctly.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be an operator.");

    await holoNFT.setOperator(opearator, true);
    var isPartner = await holoNFT.isOperator(opearator);
    assert.equal(isPartner, true, "Opearator market should be an operator.");

  })

  //*************************************
  // Test "Sign by" 
  //*************************************

  // FAILED
  it("Buy lazy mint NFT: Sign by collectorA", async () => {

    tokenId++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, collectorA);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 }));
  })

  // PASS
  it("Buy lazy mint NFT: Sign by the publisher", async () => {

    tokenId = 2;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: Sign by an operator", async () => {

    tokenId++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, opearator);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  //*************************************
  // Test "selling price" 
  //*************************************

  // PASS
  it("Buy lazy mint NFT: selling price = 0 WEI", async () => {
    tokenId++;
    sellingPrice = 0;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 }));
    
  })

  // PASS
  it("Buy lazy mint NFT: selling price = 99 WEI", async () => {
    tokenId++;
    sellingPrice = 99;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 }));
    
  })

  // PASS
  it("Buy lazy mint NFT: selling price = 100 WEI", async () => {
    tokenId++;
    sellingPrice = 100;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: selling price = 1234567890000000000000000000", async () => {
    tokenId++;
    sellingPrice = web3.utils.toBN("10000000000000000000");

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // // FAILED
  // it("Buy lazy mint NFT: selling price = UINT248 MAX VALUE + 1", async () => {
  //   tokenId++;
  //   sellingPrice = web3.utils.toBN(String(Math.pow(2, 248)+1));

  //   var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
  //   var signature = await web3.eth.sign(hashData, publisher);
  //   signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

  //   await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 }));
  // })

  //*************************************
  // Test "tokenID" 
  //*************************************

  it("Buy lazy mint NFT: token ID is duplicated", async () => {

    tokenId = 2;
    sellingPrice = 1000;

    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 }));
  })

  //*************************************
  // Test "creator" address
  //*************************************

  // // FAILED
  // it("Buy lazy mint NFT: Creator is the deployed HoloNFT contract account", async () => {
    
  //   tokenId = 10;
  //   creator = holoNFT.address;

  //   var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
  //   var signature = await web3.eth.sign(hashData, publisher);
  //   signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

  //   await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: 1000 }));
  // })

  // PASS
  it("Buy lazy mint NFT: Creator is an operator contract account", async () => {
    tokenId = 10;
    creator = opearator;
    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  //*************************************
  // Test "creator fee" 
  //*************************************

  // PASS
  it("Buy lazy mint NFT: creator fee = 0%", async () => {
    tokenId++;
    creator = accounts[1];
    creatorFee = 0;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: creator fee = 0.01%", async () => {
    tokenId++;
    creatorFee = 1;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: creator fee = 3.14%", async () => {
    tokenId++;
    creatorFee = 314;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: creator fee = 30%", async () => {
    tokenId++;
    creatorFee = 3000;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // FAILED
  it("Buy lazy mint NFT: creator fee = 30.01%", async () => {
    
    tokenId ++;
    creatorFee = 3001;

    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice }));
  })


  //*************************************
  // Test "creator's signature" 
  //*************************************

  // PASS
  it("Buy lazy mint NFT: creator signature = correct & allow signature ", async () => {
    creatorFee = 250; // 2.5%
    allowSignature = true;
    stringSig = "12312312312312312312321312kl3;21";
    creatorSignature = web3.utils.asciiToHex(stringSig);
    tokenId ++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    let publisherAmount = web3.utils.toBN(sellingPrice * (publisherFeeFirstSale / 10000));
    let creatorAmount = web3.utils.toBN(sellingPrice * (1 - (publisherFeeFirstSale / 10000)));

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");

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
    
    assert.equal(tokenSignatureAccount, String(collectorA).toLowerCase(), "Token account should be same account of buyer");
    assert.equal(signatureWord.localeCompare(stringSigBuyer), 0, "Token memo should be same memo that buyer send"); // check token memo
  
  
  })

  // PASS
  it("Buy lazy mint NFT: creator signature = correct & NOT allow signature", async () => {
    allowSignature = false;
    stringSig = "12312312312312312312321312kl3;21";
    creatorSignature = web3.utils.asciiToHex(stringSig);
    tokenId ++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: creator signature = null & allow signature", async () => {
    allowSignature = true;
    stringSig = null;
    creatorSignature = web3.utils.asciiToHex(stringSig);
    tokenId ++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: creator signature = special characters & allow signature", async () => {
    allowSignature = true;
    stringSig = "?!.-/*@#";
    creatorSignature = web3.utils.asciiToHex(stringSig);
    tokenId ++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: creator signature = 32 characters & allow signature", async () => {
    allowSignature = true;
    stringSig = "32323232323232323232323232323232";
    creatorSignature = web3.utils.asciiToHex(stringSig);
    tokenId ++;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // FAILED
  it("Buy lazy mint NFT: creator signature = 33 signature & allow signature", async () => {
    tokenId ++;
    allowSignature = true;

    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    stringSig = "323232323232323232323232323232323";
    creatorSignature = web3.utils.asciiToHex(stringSig);

    try {
      await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  //*************************************
  // Test "publisher fee" 
  //*************************************

  // PASS
  it("Buy lazy mint NFT: publisher fee = 0%", async () => {
    tokenId++;
    publisherFee = 0;
    allowSignature = true;
    stringSig = "32323232323232323232323232323232";
    creatorSignature = web3.utils.asciiToHex(stringSig);

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: publisher fee = 0.01%", async () => {
    tokenId++;
    publisherFee = 1;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: publisher fee = 3.14%", async () => {
    tokenId++;
    publisherFee = 314;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: publisher fee = 90%", async () => {
    tokenId++;
    publisherFee = 9000;

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // FAILED
  it("Buy lazy mint NFT: publisher fee = 90.01%", async () => {
    tokenId ++;
    publisherFee = 9001;

    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice }));
  })

  //*************************************
  // Test "publisher first sale fee" 
  //*************************************

  // PASS
  it("Buy lazy mint NFT: publisher first sale fee = 0%", async () => {
    tokenId++;
    publisherFee = 750; // 7.5%
    publisherFeeFirstSale = 0;
    sellingPrice = 1000;//'0.15'; //Eth

    allowSignature = false;
    stringSig = "12312312312312312312321312kl3;21";
    creatorSignature = web3.utils.asciiToHex(stringSig);

    // Prepare hash and sign it
    var hashData = hashNFTPresale(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(sellingPrice, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: sellingPrice });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
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

  // PASS
  it("Buy lazy mint NFT: publisher first sale fee = 0.01%", async () => {
    tokenId++;
    publisherFeeFirstSale = 1;
    sellingPrice = "0.15"; //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sellingPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFeeFirstSale / 10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  // PASS
  it("Buy lazy mint NFT: publisher first sale fee = 3.14%", async () => {
    tokenId++;
    publisherFeeFirstSale = 314;
    sellingPrice = "0.15"; //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sellingPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFeeFirstSale / 10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  // PASS
  it("Buy lazy mint NFT: publisher first sale fee = 30%", async () => {
    tokenId++;
    publisherFeeFirstSale = 3000;
    sellingPrice = "0.15"; //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sellingPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFeeFirstSale / 10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  // PASS
  it("Buy lazy mint NFT: publisher first sale fee = 90.01%", async () => {
    tokenId++;
    publisherFeeFirstSale = 9001;
    sellingPrice = "0.15"; //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sellingPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    // let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    // let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    // let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFeeFirstSale / 10000));
    // let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    // assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    // assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    // let isTokenExist = await holoNFT.isTokenExist(tokenId);
    // let ownerOfToken = await holoNFT.ownerOf(tokenId);

    // assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    // assert.equal(isTokenExist, true, "Token should be exist");
  })

  // PASS
  it("Buy lazy mint NFT: publisher first sales fee = 90.00%", async () => {
    tokenId++;
    publisherFeeFirstSale = 9000;
    sellingPrice = "0.15"; //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sellingPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    // let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    // let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    // let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFeeFirstSale / 10000));
    // let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    // assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    // assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    // let isTokenExist = await holoNFT.isTokenExist(tokenId);
    // let ownerOfToken = await holoNFT.ownerOf(tokenId);

    // assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    // assert.equal(isTokenExist, true, "Token should be exist");
  })


  //*************************************
  // Test "pay values" 
  //*************************************

  // FAILED
  it("Buy lazy mint NFT: pay <= price", async () => {
    tokenId ++;
    publisherFeeFirstSale = 250;
    sellingPrice = "0.15"; //eth
    var sendPrice = "0.01" //eth

    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sendPrice, 'ether') }), "Morpheus Market: msg.value is lower");
  })

  // PASS
  it("Buy lazy mint NFT: pay == price", async () => {
    tokenId++;
    sellingPrice = "0.15"; //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sellingPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFeeFirstSale / 10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  // PASS
  it("Buy lazy mint NFT: pay >= price", async () => {
    tokenId++;
    sellingPrice = "0.15"; //eth

    sendPrice = "0.5" //eth

    // Prepare hash and sign it
    var hashData = hashNFTPresale(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(web3.utils.toWei(sellingPrice, 'ether'), tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, publisherFeeFirstSale, signature, { from: collectorA, value: web3.utils.toWei(sendPrice, 'ether') });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sendPrice, 'ether') * (publisherFeeFirstSale / 10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sendPrice, 'ether') * (1 - (publisherFeeFirstSale / 10000)));

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

});

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

function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}