const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE!

contract("HoloNFTMintTo", accounts => {

  var holoNFT;

  var tokenId;
  var creatorFee;
  var publisherFee;
  var sellingPrice;

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var operator = accounts[7];;
  var nonOperator;

  var stringSig
  var signature;
  var allowSig;


  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    nonOperator = await MorpheusMarket.new(holoNFT.address);

    // set and make sure that the publisher is set correctly
    var publisherFeeCollector = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherFeeCollector, publisher, "Publisher is not set correctly.");

    var isPartner = await holoNFT.isOperator(nonOperator.address);
    assert.equal(isPartner, false, "nonOperator should not be a partner.");

    await holoNFT.setOperator(nonOperator.address, false);
    var isPartner = await holoNFT.isOperator(nonOperator.address);
    assert.equal(isPartner, false, "nonOperator should not be a partner.");

    await holoNFT.setOperator(operator, true);
    var isPartner = await holoNFT.isOperator(operator);
    assert.equal(isPartner, true, "operator should be a partner.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be a partner.");

  })

  //*************************************
  // Test "from" 
  //*************************************

  // PASS
  it("mint to collector A with: from the contract's owner", async () => {

    tokenId = 1;
    creatorFee = 250; // 2.5%
    allowSig = true;
    stringSig = "12312312312312312312321312kl3;21";
    signature = web3.utils.asciiToHex(stringSig);
    publisherFee = 750; // 7.5%

    let tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });

    await validateToken(collectorA, tokenId, creator, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: from an operator", async () => {

    tokenId++;
    stringSig = "123456789012345678901234569012";
    signature = web3.utils.asciiToHex(stringSig);


    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: operator });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);

  })

  // FAILED
  it("mint to collector A with: from a nonOperator", async () => {

    tokenId++;
    stringSig = "123456789012345678901234569012";
    signature = web3.utils.asciiToHex(stringSig);

    try {
      await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: nonOperator });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
    
  })

  //*************************************
  // Test "to" address
  //*************************************

  // FAILED
  it("mint to collector A with: Receiver account is NULL", async () => {
    try {
      await holoNFT.mintTo(null, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("mint to collector A with: Receiver account is not an address", async () => {
    collectorA = "0x789EEEZZZZZ55481933599F0c53016AFd67F6D2F";
    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("mint to collector A with: Receiver account is the deployed HoloNFT contract account", async () => {
    collectorA = holoNFT.address;
    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // PASS
  it("mint to collector A with: Receiver account is an operator contract account", async () => {

    tokenId++;
    let tx = await holoNFT.mintTo(operator, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: operator, tokenId: web3.utils.toBN(tokenId) });

    await validateToken(operator, tokenId, creator, creatorFee, allowSig, publisherFee);

  })

  //*************************************
  // Test "tokenID" 
  //*************************************

  // FAILED
  it("mint to collector A with: token ID duplicate", async () => {
    tokenId = 1;
    await truffleAssert.reverts(holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher }));
  })

  // FAILED
  it("mint to collector A with: token ID longer than uint256", async () => {

    tokenId = 1234567890123454567890666666666666666666666789012345678901234567890;

    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
    
  })

  // FAILED
  it("mint to collector A with: token ID not uint256", async () => {

    tokenId = "adbakdsfaj;dask123123123";

    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  // FAILED
  it("mint to collector A with: token ID is NULL", async () => {

    try {
      await holoNFT.mintTo(collectorA, null, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  //*************************************
  // Test "creator" address
  //*************************************

  // FAILED
  it("mint to collector A with: Creator is NULL", async () => {
    tokenId = 3000;

    try {
      await holoNFT.mintTo(collectorA, tokenId, null, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("mint to collector A with: Creator is not an address", async () => {
    creator = "0x789EEEZZZZZ55481933599F0c53016AFd67F6D2F";
    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("mint to collector A with: Creator is the deployed HoloNFT contract account", async () => {
    creator = holoNFT.address;
    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // PASS
  it("mint to collector A with: Creator is an operator contract account", async () => {
    tokenId++;
    let tx = await holoNFT.mintTo(operator, tokenId, operator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: operator, tokenId: web3.utils.toBN(tokenId) });

    await validateToken(operator, tokenId, operator, creatorFee, allowSig, publisherFee);
  })

  //*************************************
  // Test "creator fee" 
  //*************************************

  // PASS
  it("mint to collector A with: creator fee = 0%", async () => {

    tokenId++;
    creatorFee = 000;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);

  })

  // PASS
  it("mint to collector A with: creator fee = 0.01%", async () => {
    tokenId++;
    creatorFee = 1;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: creator fee = 1.25%", async () => {

    tokenId++;
    creatorFee = 125;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: creator fee = 30.00%", async () => {

    tokenId++;
    creatorFee = 3000;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);

  })

  // FAILED
  it("mint to collector A with: creator fee = 30.01%", async () => {

    tokenId++;
    creatorFee = 3001;

    await truffleAssert.reverts(holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher }));

  })

  // FAILED
  it("mint to collector A with: creator fee = -1.00%", async () => {

    tokenId++;
    creatorFee = -100;

    try {
      await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  //*************************************
  // Test "creator's signature" 
  //*************************************

  // PASS
  it("mint to collector A with: signature is correct & allow signature", async () => {
    tokenId++;
    creatorFee = 1000;
    stringSig = "zzzzzzzzzzzzzzz"
    signature = web3.utils.asciiToHex(stringSig);
    allowSig = true;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: signature is correct & NOT allow signature", async () => {
    tokenId++;
    creatorFee = 1000;
    stringSig = "zzzzzzzzzzzzzzz"
    signature = web3.utils.asciiToHex(stringSig);
    allowSig = false;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: null signature & allow signature", async () => {

    tokenId++;
    creatorFee = 1000;
    stringSig = null
    signature = web3.utils.asciiToHex(stringSig);

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);
    
  })

  // PASS
  it("mint to collector A with: special characters in signature  & allow signature", async () => {

    tokenId++;
    stringSig = "&^$%#@!_{}";
    signature = web3.utils.asciiToHex(stringSig);

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);

    let tokenSig = await holoNFT.getTokenSignature(tokenId);
    let tokenSigText = hex_to_ascii(tokenSig.substring(42, tokenSig.length)); // 64 + 42

    assert.equal(tokenSigText.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo

  })

  // PASS
  it("mint to collector A with: 32 characters in signature  & allow signature", async () => {

    tokenId++;
    stringSig = "12345678901234567890123456789012";
    signature = web3.utils.asciiToHex(stringSig);

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    await validateToken(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, publisherFee);

  })

  // FAILED
  it("mint to collector A with: 33 characters in signature & allow signature", async () => {

    tokenId++;
    stringSig = "123456789012345678901234567890123";
    signature = web3.utils.asciiToHex(stringSig);

    try {
      await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  //*************************************
  // Test "publisher fee" 
  //*************************************

  // PASS
  it("mint to collector A with: publisher fee = 0%", async () => {
    tokenId++;
    publisherFee = 000; // 0%
    stringSig = "12345678901234567890123456789013";
    signature = web3.utils.asciiToHex(stringSig);


    tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: publisher fee = 0.01%", async () => {
    tokenId++;
    publisherFee = 1; // 0.01%


    tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: publisher fee = 1.25%", async () => {
    tokenId++;
    publisherFee = 125; // 1.25%


    tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSig, publisherFee);
  })

  // PASS
  it("mint to collector A with: publisher fee = 30.00%", async () => {
    tokenId++;
    publisherFee = 30; // 30%


    tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });
    await validateToken(collectorA, tokenId, creator, creatorFee, allowSig, publisherFee);
  })

  // FAILED
  it("mint to collector A with: publisher fee = 90.01%", async () => {
    tokenId++;
    publisherFee = 9001;

    await truffleAssert.reverts(holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher }));
  })

  // FAILED
  it("mint to collector A with: publisher fee = -1.00%", async () => {
    tokenId++;
    publisherFee = -100;

    try {
      await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

});

async function validateToken(owner, tokenId, creator, creatorFee, allowSig, publisherFee)
  {
    let holoNFT = await HoloNFT.deployed();

    let tokenOwner = await holoNFT.ownerOf(tokenId)
    let tokenCreator = await holoNFT.getCreatorAddress(tokenId);
    let tokenCreatorFee = await holoNFT.getCreatorFee(tokenId);
    let tokenIsAllowSig = await holoNFT.isAllowSignature(tokenId);
    let tokenSignature = await holoNFT.getTokenSignature(tokenId);
    let tokenPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(tokenOwner,owner, "Incorrect: tokenOwner");
    assert.equal(tokenCreator,creator, "Incorrect: tokenCreator");
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
