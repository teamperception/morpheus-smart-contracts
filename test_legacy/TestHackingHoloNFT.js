const HoloNFT = artifacts.require("./HoloNFT.sol");
const truffleAssert = require('truffle-assertions');

contract("TestHackingHoloNFT", accounts => {

  const perception = accounts[0];
  const goodUser1 = accounts[1];
  const goodUser2 = accounts[2];

  const badUser1 = accounts[3];
  const badUser2 = accounts[4];

  const goodOperator1 = accounts[5];

  const partnerMarket1 = accounts[8];
  const partnerMarket2 = accounts[9];

  // ***********************
  // Perception mint a Holo-NFT token
  // ***********************

  it("Perception mint a Holo-NFT token: correctly", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 1;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = 100;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    let tx = await holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: goodUser1, tokenId: web3.utils.toBN(tokenId) });

  })

  it("Perception mint a Holo-NFT token: duplicate token ID", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 1;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = 100;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    try {
      await holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception });
      assert.equal(true, false, "Token ID is duplicated, minting should fail");
    } catch (e) {
      assert.equal(true, true);
    }
  })

  it("Perception mint a Holo-NFT token: negative creator fee", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = -1;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    try {
      await holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception });
      assert.equal(true, false, "Creator fee should not be negative value.");
    } catch (e) {
      assert.equal(true, true);
    }
  })

  it("Perception mint a Holo-NFT token: over limit creator fee", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = 20000;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    await truffleAssert.reverts(holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception }), "HoloNFT: Creator fee out of range");

  })

  it("Perception mint a Holo-NFT token: memo exact limit (32 characters)", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = 100;
    var message = "12345678901234567890123456789012";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    let tx = await holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: goodUser1, tokenId: web3.utils.toBN(tokenId) });

  })

  it("Perception mint a Holo-NFT token: memo over limit (33 characters)", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = 100;
    var message = "123456789012345678901234567890123";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    try {
      await holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception });
      assert.equal(true, false, "Creator memo is longer than 32 bytes");
    } catch (e) {
      assert.equal(true, true);
    }
  })

  it("Perception mint a Holo-NFT token: negative token ID", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = -2;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creatorFee = 1;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    try {
      await holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: perception });
      assert.equal(true, false, "Token ID should not be negative value.");
    } catch (e) {
      assert.equal(true, true);
    }
  })

  // ***********************
  // Perception set publisher fee
  // ***********************

  it("Perception set publisher fee: publisher fee over limit", async () => {

    let holoNFT = await HoloNFT.deployed();

    let newFee = 5001;

    await truffleAssert.reverts(holoNFT.setPublisherFee(newFee, { from: perception }), "HoloNFT: Creator fee out of range");

  })

  // ***********************
  // Partner market transfer item
  // ***********************

  it("Partner market transfer item: correctly", async () => {

    let holoNFT = await HoloNFT.deployed();
    

    await holoNFT.setOperator(partnerMarket1, true, { from: perception });
    await holoNFT.setApprovalForAll(partnerMarket1, true, { from: perception });

    await holoNFT.safeTransferFromWithMemo(goodUser1,goodUser2,)
    
  })

  it("Partner market transfer item: no rights", async () => {

    let holoNFT = await HoloNFT.deployed();
    await holoNFT.setOperator(partnerMarket1, false, { from: perception });


  })

  // ***********************
  // Token owner set backup URIs
  // ***********************

  it("Token owner set backup URIs: URI set of nonexistent token", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 200;
    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await truffleAssert.reverts(holoNFT.setBackupURIs(tokenId, backupURI, { from: goodUser1 }), "ERC721: owner query for nonexistent token");

  })

  // ***********************
  // Other user try to call Perception function
  // ***********************

  it("Other user try to call Perception function: Mint Holo-NFT", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a2bf4f1b2b0b822cd15d6c15b0f00a92";
    let creatorFee = 100;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    await truffleAssert.reverts(
      holoNFT.mintTo(goodUser1, tokenId, tokenURI, goodUser1, creatorFee, memo, { from: badUser1 }), "Ownable: caller is not the owner");

  })

  it("Other user try to call Perception function: Set base URI", async () => {
    let holoNFT = await HoloNFT.deployed();

    let newBaseURI = "https://www.morpheus.art/";

    await truffleAssert.reverts(holoNFT.setBaseURI(newBaseURI, { from: badUser1 }), "Ownable: caller is not the owner");
  })

  it("Other user try to call Perception function: Set a token's URI", async () => {
    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let newTokenURI = "beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await truffleAssert.reverts(holoNFT.setTokenURI(tokenId, newTokenURI, { from: badUser1 }), "Ownable: caller is not the owner");
  })

  it("Other user try to call Perception function: Burn an item", async () => {
    let holoNFT = await HoloNFT.deployed();
    let tokenId = 2;

    await truffleAssert.reverts(holoNFT.burn(tokenId, { from: badUser1 }), "Ownable: caller is not the owner");
  })

  it("Other user try to call Perception function: Set publisher", async () => {
    let holoNFT = await HoloNFT.deployed();

    await truffleAssert.reverts(holoNFT.setPublisherFeeCollector(badUser1, { from: badUser1 }), "Ownable: caller is not the owner");
  })

  it("Other user try to call Perception function: Set publisher fee", async () => {
    let holoNFT = await HoloNFT.deployed();

    let publisherFee = 3;

    await truffleAssert.reverts(holoNFT.setPublisherFee(web3.utils.toBN(publisherFee), { from: badUser1 }), "Ownable: caller is not the owner");
  })

  it("Other user try to call Perception function: Set owner", async () => {
    let holoNFT = await HoloNFT.deployed();

    await truffleAssert.reverts(holoNFT.transferOwnership(badUser1, { from: badUser1 }), "Ownable: caller is not the owner");
  })

  // ***********************
  // Bad user set backup URIs
  // ***********************

  it("Bad user set backup URIs: transfer of token that is not owner", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await truffleAssert.reverts(holoNFT.setBackupURIs(tokenId, backupURI, { from: badUser1 }), "ERC721: transfer of token that is not own");

  })

  // ***********************
  // Bad user try to transfer an item without approval
  // ***********************

  it("Bad user try to transfer an item without approval: via safeTransferFrom with memo", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;
    var message = "";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    await truffleAssert.reverts(holoNFT.safeTransferFromWithMemo(goodUser1, badUser1, tokenId, memo, { from: badUser1 }), "Ownable: caller is not the owner");

  })

  it("Bad user try to transfer an item without approval: via transfer", async () => {
  })

  it("Bad user try to transfer an item without approval: via safe transfer with data", async () => {
  })

  it("Bad user try to transfer an item without approval: via safe transfer without data", async () => {

    let holoNFT = await HoloNFT.deployed();

    let tokenId = 2;

    await truffleAssert.reverts(holoNFT.safeTransferFrom(goodUser1, badUser1, tokenId, { from: badUser1 }), "ERC721: transfer caller is not owner nor approved");  
  
  })

  // ***********************
  // Etc
  // ***********************

  it("A user set assign super operator: to Perception", async () => {
  })

  /*it("Read private data", async () => {

    let holoNFT = await HoloNFT.deployed();
    
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 0));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 1));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 2));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 3));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 4));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 5));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 6));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 7));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 8));
    console.log(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 9));
    console.log(await web3.utils.numberToHex(await web3.eth.getStorageAt("0x8EdCE378272Ea7eE6F056a0f2d4B38905B803C60", 6)));

  })*/



});


function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}