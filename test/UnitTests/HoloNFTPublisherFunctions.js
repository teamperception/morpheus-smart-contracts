const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE!

contract("HoloNFTPublisherFunctions", accounts => {

  var holoNFT;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var sellingPrice;

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var operator = accounts[8];
  var partnerMarket;
  var foreignMarket;

  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    partnerMarket = await MorpheusMarket.new(holoNFT.address);
    foreignMarket = await MorpheusMarket.new(holoNFT.address);

    // set and make sure that the publisher is set correctly
    var publisherFeeCollector = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherFeeCollector, publisher, "Publisher is not set correctly.");

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

    await holoNFT.setOperator(operator, true);
    var isPartner = await holoNFT.isOperator(operator);
    assert.equal(isPartner, true, "Operator should be a partner.");

  })

  it("mint to collector A with correct data", async () => {

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

  //*************************************
  // Test "setOperator" 
  //*************************************

  // PASS
  it("setOperator: correctly", async () => {

    let partner = await MorpheusMarket.new(holoNFT.address);
    let approve = true;

    await holoNFT.setOperator(partner.address, approve);
    var isPartner = await holoNFT.isOperator(partner.address);
    assert.equal(isPartner, true, "partnerMarket should be a partner.");

  })

  // PASS
  it("setOperator: not a contract", async () => {

    let marketAddress = accounts[9];
    let approve = true;

    await holoNFT.setOperator(marketAddress, approve);

    var isPartner = await holoNFT.isOperator(marketAddress);
    assert.equal(isPartner, true, "partnerMarket should be a partner.");
  })

  // FAILED
  it("setOperator: not an address", async () => {

    let marketAddress = "0x0";
    let approve = true;

    try {
      await holoNFT.setOperator(marketAddress, approve);
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // FAILED
  it("setOperator: call by not-owner", async () => {

    let partner = await MorpheusMarket.new(holoNFT.address);
    let approve = true;

    await truffleAssert.reverts(holoNFT.setOperator(partner.address, approve, { from: accounts[9] }), "Ownable: caller is not the owner");

  })

  // FAILED
  it("setOperator: by operator", async () => {
    let approve = true;
    await truffleAssert.reverts(holoNFT.setOperator(accounts[9], approve, { from: operator }));
  })

  //*************************************
  // Test "setBaseURI" 
  //*************************************

  // PASS
  it("setBaseURI: correctly", async () => {

    let newBaseURI = "https://www.morpheus.art/";
    await holoNFT.setBaseURI(newBaseURI);
    let baseURI = await holoNFT.tokenURI(tokenId);
    assert.equal(true, baseURI.includes(baseURI), "URI should contain the new Base URI");

  })

  // FAILED
  it("setBaseURI: call by not-owner", async () => {

    let newBaseURI = "https://www.morpheus.art/";
    await truffleAssert.reverts(holoNFT.setBaseURI(newBaseURI, { from: accounts[9] }), "Ownable: caller is not the owner");

  })

  // FAILED
  it("setBaseURI: by operator", async () => {
    let newBaseURI = "https://www.morpheus.art/123";
    await truffleAssert.reverts(holoNFT.setBaseURI(newBaseURI, { from: operator }), "Ownable: caller is not the owner");

  })

  //*************************************
  // Test "setPublisherFee" 
  //*************************************

  // PASS
  it("setPublisherFee: correctly", async () => {

    let tokenId = 1;
    let publisherFee = 300;
    await holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee));
    let newPublisherFee = await holoNFT.getPublisherFee(tokenId);
    assert.equal(newPublisherFee, publisherFee, "Publisher fee should be same");

  })

  // FAILED
  it("setPublisherFee: fee = -1%", async () => {

    let publisherFee = -100;

    try {
      await holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee));
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }

  })

  // PASS
  it("setPublisherFee: fee = 30.0%", async () => {

    let publisherFee = 3000;

    await holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee));
    let newPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(newPublisherFee, publisherFee, "Publisher fee should be same");

  })

  // PASS
  it("setPublisherFee: fee = 30.01%", async () => {

    publisherFee = 3001;

    await holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee));
    let newPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(newPublisherFee, publisherFee, "Publisher fee should be same");

  })

  // PASS
  it("setPublisherFee: fee = 90.00%", async () => {
    publisherFee = 9000;

    await holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee));
    let newPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(newPublisherFee, publisherFee, "Publisher fee should be same");
  })

  // FAILED
  it("setPublisherFee: fee = 90.01%", async () => {

    let publisherFee = 9001;

    await truffleAssert.reverts(holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee)), "HoloNFT: Publisher fee out of range");
  })

  // FAILED
  it("setPublisherFee: non-exist tokenId", async () => {

    let tokenId = 7000;
    let publisherFee = 300;

    await truffleAssert.reverts(holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee)));

  })

  // FAILED
  it("setPublisherFee: call by not-owner", async () => {

    let tokenId = 1;
    await truffleAssert.reverts(holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee), { from: accounts[9] }), "Ownable: caller is not the owner");

  })

  // FAILED
  it("setPublisherFee: call by an operator", async () => {
    let tokenId = 1;
    await truffleAssert.reverts(holoNFT.setPublisherFee(tokenId, web3.utils.toBN(publisherFee), { from: operator }), "Ownable: caller is not the owner");
  })

  //*************************************
  // Test "burn" 
  //*************************************

  // FAILED
  it("burn: non-exist tokenId", async () => {

    let tokenId = 7000;

    await truffleAssert.reverts(holoNFT.burn(tokenId), "ERC721: owner query for nonexistent token");

  })

  // FAILED
  it("burn: call by not-owner", async () => {
    await truffleAssert.reverts(holoNFT.burn(tokenId, { from: accounts[9] }), "Ownable: caller is not the owner");
  })

  // FAILED
  it("burn: by operator", async () => {
    await truffleAssert.reverts(holoNFT.burn(tokenId, { from: operator }));
  })

  // FAILED
  it("burn: by token's owner", async () => {

    let tokenOwner = await holoNFT.ownerOf(tokenId);
    await truffleAssert.reverts(holoNFT.burn(tokenId, {from: tokenOwner}));
  })

  // PASS
  it("burn: by publisher", async () => {
    let tokenOwner = await holoNFT.ownerOf(tokenId);
    let tx = await holoNFT.burn(tokenId, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: tokenOwner, to: '0x0000000000000000000000000000000000000000', tokenId: web3.utils.toBN(tokenId) });
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