const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

contract("SetBackupURI", accounts => {

  // STATUS: DONE

  var holoNFT;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var sellingPrice;

  var publisher = accounts[0];
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
    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisher, "Publisher is not set correctly.");

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

  // PASS
  it("Set backup URI: Correct params", async () => {

    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await holoNFT.setBackupURIs(tokenId, backupURI, { from: collectorA });

    let getBackupURI = await holoNFT.getBackupURI(tokenId);

    assert.equal(getBackupURI, backupURI, "Token backup URI should be same");

  })

  // FAILED
  it("Set backup URI: Non-exist token ID", async () => {

    let tokenId = 200;
    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await truffleAssert.reverts(holoNFT.setBackupURIs(tokenId, backupURI, { from: collectorA }), "ERC721: owner query for nonexistent token");

  })

  // FAILED
  it("Set backup URI: Not the token's owner", async () => {

    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await truffleAssert.reverts(holoNFT.setBackupURIs(tokenId, backupURI, { from: collectorB }), "HoloNFT: Sender is not the token's owner");

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