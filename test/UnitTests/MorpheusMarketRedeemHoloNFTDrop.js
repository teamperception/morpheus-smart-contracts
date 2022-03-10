const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE

contract("MorpheusMarketRedeemHoloNFTDrop", accounts => {

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
  var operator = accounts[5];

  it("Setup HoloNFT and Morpheus market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisher, "Publisher is not set correctly.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be an operator.");

    await holoNFT.setOperator(operator, true);
    var isPartner = await holoNFT.isOperator(operator);
    assert.equal(isPartner, true, "Operator market should be an operator.");

  })

  //*************************************
  // Test "Sign by" 
  //*************************************

  // FAILED
  it("NFT Drop for CollectorA: Sign by collectorA", async () => {

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, collectorA);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA }));
  })

  // PASS
  it("NFT Drop for CollectorA: Sign by the publisher", async () => {

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  // PASS
  it("NFT Drop for CollectorA: Sign by an operator", async () => {

    tokenId++;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, operator);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  //*************************************
  // Test "to" address
  //*************************************

  // FAILED
  it("NFT Drop for CollectorA: Receiver account is NULL", async () => {
    tokenId++
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
      await morpheuseMarket.redeemHoloNFTDrop(null, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("NFT Drop for CollectorA: Receiver account is not an address", async () => {
    tokenId++
    // Prepare hash and sign it
    var collectorA = accounts[2];
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    collectorA = "0xA66CE31f94855481933599F00000000000000000";
    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("NFT Drop for CollectorA: Receiver account is the deployed HoloNFT contract account", async () => {
    /*tokenId++
    collectorA = holoNFT.address;
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");


    await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA }));*/
  })

  // PASS
  it("NFT Drop for CollectorA: Receiver account is an operator contract account", async () => {
    tokenId++;
    // Prepare hash and sign it
    var hashData = hashNFTDrop(operator, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
    let tx = await morpheuseMarket.redeemHoloNFTDrop(operator, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: operator });
    await validateToken(operator, tokenId, creator, creatorFee, allowSignature, publisherFee);
    
    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);
    
    assert.equal(ownerOfToken, operator, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  //*************************************
  // Test "tokenID" 
  //*************************************

  // PASS
  it("NFT Drop for CollectorA: token ID is duplicated", async () => {

    let tokenId = 1;

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA }));
  })

  it("NFT Drop for CollectorA: token ID have 77 char", async () => {

    let tokenId = web3.utils.toBN('99999999999999999999999999999999999999999999999999999999999999999999999999999'); // 78char

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);

    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await morpheuseMarket.redeemHoloNFTDrop(
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

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  it("NFT Drop for CollectorA: token ID have 78 char", async () => {

    try {
      let tokenId = web3.utils.toBN('999999999999999999999999999999999999999999999999999999999999999999999999999999'); // 78char
      var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee);

      var signature = await web3.eth.sign(hashData, publisher);
      signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

      await morpheuseMarket.redeemHoloNFTDrop(
        collectorA,
        tokenId,
        creator,
        creatorFee,
        allowSignature,
        creatorSignature,
        publisherFee,
        signature,
        { from: collectorA }
      );
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  it("NFT Drop for CollectorA: token ID is null", async () => {

    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, null, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
    
  })

  //*************************************
  // Test "creator" address
  //*************************************

  // FAILED
  it("NFT Drop for CollectorA: Creator is NULL", async () => {
    tokenId++;
    let creator = "0x0000000000000000000000000000000000000000";
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA }));
  })

  // FAILED
  it("NFT Drop for CollectorA: Creator is not an address", async () => {
    tokenId++;
    let creator = "0x045345jnvbzdfgsddfa";

    var hashData = hashNFTDrop(collectorA, tokenId, accounts[0], creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
    
    
  })

  // PASS
  it("NFT Drop for CollectorA: Creator is the deployed HoloNFT contract account", async () => {
    tokenId++;
    let creator = holoNFT.address;

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
  })

  // PASS
  it("NFT Drop for CollectorA: Creator is an operator contract account", async () => {
        
    tokenId++;
    let creator = operator;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
  })

  //*************************************
  // Test "creator fee" 
  //*************************************

  // PASS
  it("NFT Drop for CollectorA: creator fee = 0%", async () => {
    
    tokenId++;
    let creator = accounts[1];
    let creatorFee = 0;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);


    let getCreatorFee = await holoNFT.getCreatorFee(tokenId);

    assert.equal(getCreatorFee, creatorFee, "creator fee should be same");
  })

  // PASS
  it("NFT Drop for CollectorA: creator fee = 0.01%", async () => {
        
    tokenId++;
    let creatorFee = 1;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);


    let getCreatorFee = await holoNFT.getCreatorFee(tokenId);

    assert.equal(getCreatorFee, creatorFee, "creator fee should be same");
  })

  // PASS
  it("NFT Drop for CollectorA: creator fee = 3.14%", async () => {
        
    tokenId++;
    let creatorFee = 314;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);


    let getCreatorFee = await holoNFT.getCreatorFee(tokenId);

    assert.equal(getCreatorFee, creatorFee, "creator fee should be same");
  })

  // PASS
  it("NFT Drop for CollectorA: creator fee = 30%", async () => {
        
    tokenId++;
    let creatorFee = 3000;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let getCreatorFee = await holoNFT.getCreatorFee(tokenId);

    assert.equal(getCreatorFee, creatorFee, "creator fee should be same");
  })

  // FAILED
  it("NFT Drop for CollectorA: creator fee = 30.01%", async () => {
    tokenId++;
    let creatorFee = 3001;

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA }));
  })

  // FAILED
  it("NFT Drop for CollectorA: creator fee = -0.01%", async () => {
    tokenId++;
    let creatorFee = 1;

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    //await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee, signature, { from: collectorA }));

    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, -creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  //*************************************
  // Test "creator's signature" 
  //*************************************

  // PASS
  it("NFT Drop for CollectorA: creator signature = correct & allow signature ", async () => {
    tokenId++;
    creatorFee = 250;
    let allowSignature = true;
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

  })

  // PASS
  it("NFT Drop for CollectorA: creator signature = correct & NOT allow signature", async () => {
    tokenId++;
    let allowSignature = false;
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
  })

  // PASS
  it("NFT Drop for CollectorA: creator signature = null & allow signature", async () => {
    tokenId++;
    let allowSignature = true;
    let stringSig = null;
    let creatorSignature = web3.utils.asciiToHex(stringSig);
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
  })

  // PASS
  it("NFT Drop for CollectorA: creator signature = special characters & allow signature", async () => {
    tokenId++;
    let allowSignature = true;
    let stringSig = "&^$%#@!_{}";
    let creatorSignature = web3.utils.asciiToHex(stringSig);
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
  })

  // PASS
  it("NFT Drop for CollectorA: creator signature = 32 characters & allow signature", async () => {
    tokenId++;
    let allowSignature = true;
    let stringSig = "12345678901234567890123456789012";
    let creatorSignature = web3.utils.asciiToHex(stringSig);
    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);
  })

  // FAILED
  it("NFT Drop for CollectorA: creator signature = 33 signature & allow signature", async () => {
    tokenId++;
    let allowSignature = true;
    let stringSig = "12345678901234567890123456789013";
    let creatorSignature = web3.utils.asciiToHex(stringSig);

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  //*************************************
  // Test "publisher fee" 
  //*************************************

  // PASS
  it("NFT Drop for CollectorA: publisher fee = 0%", async () => {
    tokenId++;
    let publisherFee = 0;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let getPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(getPublisherFee, publisherFee, "publisher fee should be same");
  })

  // PASS
  it("NFT Drop for CollectorA: publisher fee = 0.01%", async () => {
    tokenId++;
    let publisherFee = 1;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let tx = await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let getPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(getPublisherFee, publisherFee, "publisher fee should be same");
  })

  // PASS
  it("NFT Drop for CollectorA: publisher fee = 3.14%", async () => {
    tokenId++;
    let publisherFee = 314;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let getPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(getPublisherFee, publisherFee, "publisher fee should be same");
  })

  // PASS
  it("NFT Drop for CollectorA: publisher fee = 30%", async () => {
    tokenId++;
    let publisherFee = 3000;

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSignature, publisherFee);

    let getPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(getPublisherFee, publisherFee, "publisher fee should be same");
  })

  // FAILED
  it("NFT Drop for CollectorA: publisher fee = 90.01%", async () => {
    tokenId++;
    let publisherFee = 9001;

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await truffleAssert.reverts(morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, { from: collectorA }));
  })

  // FAILED
  it("NFT Drop for CollectorA: publisher fee = -0.01%", async () => {
    tokenId++;
    let publisherFee = 1;

    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
      await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, -publisherFee, signature, { from: collectorA });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
    
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

function hashNFTDrop(toAccount, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee) {
  return web3.utils.soliditySha3(
    { t: 'address', v: toAccount },
    { t: 'uint256', v: tokenId },
    { t: 'address', v: creatorAccount },
    { t: 'uint16', v: creatorFee },
    { t: 'bool', v: allowSignature },
    { t: 'bytes32', v: creatorSignature },
    { t: 'uint16', v: publisherFee });
}