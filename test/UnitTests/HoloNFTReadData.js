const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE

contract("HoloNFTReadData", accounts => {

  var holoNFT;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var partnerMarket;
  var foreignMarket;

  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    partnerMarket = await MorpheusMarket.new(holoNFT.address);
    foreignMarket = await MorpheusMarket.new(holoNFT.address);

    // set and make sure that the publisher is set correctly
    var publisherFeeCollectorAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherFeeCollectorAddress, publisher, "Publisher is not set correctly.");

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

  it("mint to collector A with correct data", async () => {

    let stringSig = "Hello HoloNFT";
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

  //*************************************
  // Test "getTokenDetail" 
  //*************************************

  it("getTokenDetail", async () => {


    var getTokenDetail = await holoNFT.getTokenDetail(tokenId);

    var isAllowSignature = await holoNFT.isAllowSignature(tokenId);
    let tokenOwner = await holoNFT.ownerOf(tokenId);
    let tokenCreator =  await holoNFT.getCreatorAddress(tokenId);
    let tokenCreatorFee =  await holoNFT.getCreatorFee(tokenId);
    let tokenSignature = await holoNFT.getTokenSignature(tokenId);

    assert.equal(getTokenDetail[0], isAllowSignature, "Token should be allow signature");
    assert.equal(getTokenDetail[1].toString(), tokenSignature, "Token signature should be same");
    assert.equal(getTokenDetail[2].toString(), tokenOwner, "Token owner should be same");
    assert.equal(getTokenDetail[3].toString(), tokenCreator, "Token creator should be same");
    assert.equal(getTokenDetail[4].toString(), tokenCreatorFee, "Token creatorFee should be same");

  })

  //*************************************
  // Test "isAllowSignature" 
  //*************************************

  it("isAllowSignature: allow", async () => {

    var isAllowSignature = await holoNFT.isAllowSignature(tokenId);

    assert.equal(isAllowSignature, true, "Token should be allow signature.");

  })

  it("isAllowSignature: not allow", async () => {

    //mint Token Id that null signature
    let tokenId = 2;
    let stringSig = null
    let signature = web3.utils.asciiToHex(stringSig);
    let allowSig = false;

    await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });

    let ownerOfToken = await holoNFT.ownerOf(tokenId)
    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID

    //check isAllowSignature
    var isAllowSignature = await holoNFT.isAllowSignature(tokenId);

    assert.equal(isAllowSignature, false, "Token should not be allow signature.");
  })

  //*************************************
  // Test "getTokenSignature" 
  //*************************************

  it("getTokenSignature: 1 person", async () => {

    let tokenSignature = await holoNFT.getTokenSignature(tokenId);
    
    let stringSig = "Hello HoloNFT";
    let getTokenSignature = tokenSignature.substring(42, tokenSignature.length); // 64 + 42
    let getAccountSignature = String(tokenSignature.substring(0, 42)).toLowerCase();
    
    let signature = hex_to_ascii(getTokenSignature);
    
    assert.equal(getAccountSignature, String(creator).toLowerCase(), "Token account should be same account of artist");
    assert.equal(signature.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo

  })

  //*************************************
  // Test "getBackupURI" 
  //*************************************

  it("getBackupURI: set value", async () => {

    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await holoNFT.setBackupURIs(tokenId, backupURI, { from: collectorA });

    let getBackupURI = await holoNFT.getBackupURI(tokenId);

    assert.equal(getBackupURI, backupURI, "Token backup URI should be same");

  })

  it("getBackupURI: no value", async () => {

    let tokenId = 2;
    var getBackupURI = await holoNFT.getBackupURI(tokenId);
    assert.equal(getBackupURI, "", "Backup URI should be NULL.");

  })

  //*************************************
  // Test "getCreatorAddress" 
  //*************************************

  it("getCreatorAddress: set value", async () => {

    var getCreatorAddress = await holoNFT.getCreatorAddress(tokenId);
    assert.equal(getCreatorAddress, creator, "Creator address should be same.");

  })

  it("getCreatorAddress: null value", async () => {

    //mint Token Id that null creatorFee
    let tokenId = 3;
    let stringSig = "Go to the moon"
    let signature = web3.utils.asciiToHex(stringSig);
    let allowSig = false;
    var creator = 0x0000000000000000000000000000000000000000; // In solidity every variable is set to 0 by default.
        
    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  //*************************************
  // Test "getCreatorFee" 
  //*************************************

  it("getCreatorFee: set value", async () => {

    var getCreatorFee = await holoNFT.getCreatorFee(tokenId);
    assert.equal(getCreatorFee, creatorFee, "Creator fee should be same.");

  })

  it("getCreatorFee: null value", async () => {

    //mint Token Id that null creatorFee
    let tokenId = 4;
    let stringSig = "Go to the moon"
    let signature = web3.utils.asciiToHex(stringSig);
    let allowSig = true;
    var creatorFee = null; // In solidity every variable is set to 0 by default.

    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
    
  })

  //*************************************
  // Test "getPublisherFeeCollectorAddress" 
  //*************************************

  it("getPublisherFeeCollectorAddress: set value", async () => {

    var getPublisherFeeCollectorAddress = await holoNFT.getPublisherFeeCollectorAddress();

    assert.equal(getPublisherFeeCollectorAddress, publisher, "Publisher address should be same.");

  })

  it("getPublisherFeeCollectorAddress: null value", async () => {

    //mint Token Id that null creatorFee
    let tokenId = 5;
    let stringSig = "Go to the moon"
    let signature = web3.utils.asciiToHex(stringSig);
    let allowSig = false;
    var creator = 0x0000000000000000000000000000000000000000; // In solidity every variable is set to 0 by default.
    
    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  //*************************************
  // Test "getPublisherFee" 
  //*************************************

  it("getPublisherFee: set value", async () => {

    var getPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(getPublisherFee, publisherFee, "Publisher fee should be same.");

  })

  it("getPublisherFee: null value", async () => {

    //mint Token Id that null creatorFee
    let tokenId = 6;
    let stringSig = "Go to the moon"
    let signature = web3.utils.asciiToHex(stringSig);
    let allowSig = false;
    var publisherFee = null; // In solidity every variable is set to 0 by default. 

    try {
      await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  //*************************************
  // Test "isTokenExist" 
  //*************************************

  it("isTokenExist: exist", async () => {

    var isTokenExist = await holoNFT.isTokenExist(tokenId);
    assert.equal(isTokenExist, true, "Token should be exist.");

  })

  it("isTokenExist: not exist", async () => {

    var tokenId = 700;
    var isTokenExist = await holoNFT.isTokenExist(tokenId);
    assert.equal(isTokenExist, false, "Token should be not exist.");

  })

  //*************************************
  // Test "isPartnerMarket" 
  //*************************************

  it("isPartnerMarket: yes", async () => {

    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be a partner.");

  })

  it("isPartnerMarket: no", async () => {

    var isPartner = await holoNFT.isOperator(accounts[9]);
    assert.equal(isPartner, false, "accounts[9] should not be a partner.");
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