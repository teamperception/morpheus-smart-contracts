const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

contract("TestPausable", (accounts) => {
  var holoNFT;
  var morpheuseMarket;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var publisherFeeFirstSale = 2000; // 20.00%
  var sellingPrice = 1000;
  var allowSignature = true;
  let stringSig = "test";
  let creatorSignature = web3.utils.asciiToHex(stringSig);

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var opearator = accounts[5];

  it("Setup HoloNFT and Morpheus market", async () => {
    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(
      publisherAddress,
      publisher,
      "Publisher is not set correctly."
    );

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be an operator.");

    await holoNFT.setOperator(opearator, true);
    var isPartner = await holoNFT.isOperator(opearator);
    assert.equal(isPartner, true, "Opearator market should be an operator.");
  });

  it("Check Holo-NFT is unpause", async () => {
    var isPaused = await holoNFT.paused();

    assert.equal(isPaused, false, "Contract Holo-NFT should be un pause.");
  });

  //unpause
  it("Mint to collector A with: from the contract's owner", async () => {
    tokenId = 1;
    creatorFee = 250; // 2.5%
    allowSig = true;
    stringSig = "12312312312312312312321312kl3;21";
    signature = web3.utils.asciiToHex(stringSig);
    publisherFee = 750; // 7.5%

    let tx = await holoNFT.mintTo(
      collectorA,
      tokenId,
      creator,
      creatorFee,
      allowSig,
      signature,
      publisherFee,
      { from: publisher }
    );
    truffleAssert.eventEmitted(tx, "Transfer", {
      from: "0x0000000000000000000000000000000000000000",
      to: collectorA,
      tokenId: web3.utils.toBN(tokenId),
    });
  });

  it("Buy lazy mint NFT: Sign by the publisher", async () => {
    tokenId++;

    let buyerSignature = web3.utils.asciiToHex("test");

    // Prepare hash and sign it
    var hashData = hashNFTPresale(
      sellingPrice,
      tokenId,
      creator,
      creatorFee,
      allowSignature,
      creatorSignature,
      publisherFee,
      publisherFeeFirstSale
    );
    var signature = await web3.eth.sign(hashData, publisher);
    signature =
      signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    let publisherBalance = web3.utils.toBN(
      String(await web3.eth.getBalance(publisher))
    );
    let creatorBalance = web3.utils.toBN(
      String(await web3.eth.getBalance(creator))
    );

    await morpheuseMarket.purchaseAndMintHoloNFT
    (
      sellingPrice,
      tokenId,
      creator,
      creatorFee,
      allowSignature,
      creatorSignature,
      buyerSignature,
      publisherFee,
      publisherFeeFirstSale,
      signature,
      { from: collectorA, value: 1000 }
    );

    let newPublisherBalance = web3.utils.toBN(
      String(await web3.eth.getBalance(publisher))
    );
    let newCreatorBalance = web3.utils.toBN(
      String(await web3.eth.getBalance(creator))
    );
    let publisherAmount = web3.utils.toBN(
      sellingPrice * (publisherFeeFirstSale / 10000)
    );
    let creatorAmount = web3.utils.toBN(
      sellingPrice * (1 - publisherFeeFirstSale / 10000)
    );

    assert.deepEqual(
      publisherBalance.add(publisherAmount).toString(),
      newPublisherBalance.toString(),
      "publisher Balance balance incorrect"
    );
    assert.deepEqual(
      creatorBalance.add(creatorAmount).toString(),
      newCreatorBalance.toString(),
      "creator Balance balance incorrect"
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

  it("NFT Drop for CollectorA: Sign by the publisher", async () => {
    tokenId++;

    let buyerSignature = web3.utils.asciiToHex("test");

    // Prepare hash and sign it
    var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, buyerSignature, publisherFee, signature, {from:collectorA});

    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");
  })

  it("Burn: by publisher", async () => {
    tokenId = 1;
    let tokenOwner = await holoNFT.ownerOf(tokenId);
    let tx = await holoNFT.burn(tokenId, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: tokenOwner, to: '0x0000000000000000000000000000000000000000', tokenId: web3.utils.toBN(tokenId) });
  })

  //pause
  it("Pause: by publisher", async () => {
    await holoNFT.pause();

    isPaused = await holoNFT.paused();
    assert.equal(isPaused, true, "Contract Holo-NFT should be pause.");
  })

  it("Mint to collector A with: from a publisher when pause", async () => {
    tokenId++;
    try {
      await holoNFT.mintTo(collectorA, tokenId, holoNFT.address, creatorFee, allowSig, signature, publisherFee, { from: publisher });
      assert.equal(true, false);
    } catch (e) {
      assert.equal(true, true);
    }
  })

  it("Buy lazy mint NFT: Sign by the publisher when pause", async () => {
    tokenId++;
    // Prepare hash and sign it
    var hashData = hashNFTPresale(
      sellingPrice,
      tokenId,
      creator,
      creatorFee,
      allowSignature,
      creatorSignature,
      publisherFee,
      publisherFeeFirstSale
    );
    var signature = await web3.eth.sign(hashData, publisher);
    signature =signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    try {
        await morpheuseMarket.purchaseAndMintHoloNFT
        (
          sellingPrice,
          tokenId,
          creator,
          creatorFee,
          allowSignature,
          creatorSignature,
          publisherFee,
          publisherFeeFirstSale,
          signature,
          { from: collectorA, value: 1000 }
        );
        assert.equal(true, false);
    } catch (e) {
        assert.equal(true, true);
    }
    })

    it("NFT Drop for CollectorA: Sign by the publisher when pause", async () => {
        tokenId++;
    
        // Prepare hash and sign it
        var hashData = hashNFTDrop(collectorA, tokenId, creator, creatorFee, allowSignature, creatorSignature, publisherFee);
        var signature = await web3.eth.sign(hashData, publisher);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
    
        try {
            await morpheuseMarket.redeemHoloNFTDrop(collectorA, tokenId, creator,creatorFee, allowSignature, creatorSignature,publisherFee, signature, {from:collectorA})
            assert.equal(true, false);
        } catch (e) {
            assert.equal(true, true);
        }
    })

    it("Burn: by publisher when pause", async () => {
        tokenId = 2;
        try {
            await holoNFT.burn(tokenId, { from: publisher })
            assert.equal(true, false);
        } catch (e) {
            assert.equal(true, true);
        }
      })
});

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
