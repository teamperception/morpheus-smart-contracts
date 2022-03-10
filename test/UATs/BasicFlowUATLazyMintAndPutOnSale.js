const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

// STATUS: NEED MORE TEST CASES

contract("BasicFlowUATLazyMintAndPutOnSale", accounts => {

  const TRADE_STATUS_CLOSE = 0;
  const TRADE_STATUS_SELLING = 1;
  const TRADE_STATUS_SOLD = 2;

  var holoNFT;
  var morpheuseMarket;

  var tokenId = 2;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var publisherFeeFirstSale = 2000; // 20.00%
  var sellingPrice = '0.15'; //Eth
  var allowSignature = true;
  let stringSig = "Hi World";
  let creatorSignature = web3.utils.asciiToHex(stringSig);

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var collectorB = accounts[3];
  var collectorC = accounts[4];
  var collectorD = accounts[5];

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

  it("Lazy Mint NFT for first Sale at 0.15 eth", async () => {

    let sellingPrice = '0.15'; //Eth
    let stringSig = "I am Confused";
    let creatorSignature = web3.utils.asciiToHex(stringSig);
    let buyerSignature = web3.utils.asciiToHex("test");
    tokenId = 2;

    var hashData = hashNFTPresale(
      web3.utils.toWei(sellingPrice, 'ether'), 
      tokenId, 
      creator, 
      creatorFee, 
      allowSignature, 
      creatorSignature, 
      publisherFee, 
      publisherFeeFirstSale
    );
    console.log("hashData: " + hashData);

    var signature = await web3.eth.sign(hashData, publisher);
    signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

    console.log("signature: " + signature);

    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.purchaseAndMintHoloNFT(
      web3.utils.toWei(sellingPrice, 'ether'), 
      tokenId, 
      creator, 
      creatorFee, 
      allowSignature, 
      creatorSignature,
      buyerSignature, 
      publisherFee, 
      publisherFeeFirstSale, 
      signature, 
      {from:collectorA, value:web3.utils.toWei(sellingPrice, 'ether')}
    );

    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    let publisherAmount = web3.utils.toBN(web3.utils.toWei(String(sellingPrice*(publisherFeeFirstSale/10000)), 'ether'));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(String(sellingPrice*(1-(publisherFeeFirstSale/10000))), 'ether')); 

    assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");
    
    let isTokenExist = await holoNFT.isTokenExist(tokenId);
    let ownerOfToken = await holoNFT.ownerOf(tokenId);

    assert.equal(ownerOfToken, collectorA, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(isTokenExist, true, "Token should be exist");

  })

  it("collectorA put its NFT token id 2 for first sale after lazy mint and buy at 3 eth", async () => {

    sellingPrice = '3'; //Eth

    //Publisher put collectorA's NFT on sale
    await holoNFT.approve(morpheuseMarket.address, tokenId, {from: collectorA});
    let tx = await morpheuseMarket.openTrade(tokenId, web3.utils.toWei(sellingPrice, 'ether'), { from: collectorA });
    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether')) });
  })

  it("collectorB buys collectorA's item (token id 2) (with signature) and send over price at 10.999 eth", async () => {

    let stringSig = "Go to the moon";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorB;
    let seller = collectorA;
    let sendPrice = '10.999'; //Eth

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.executeTrade(tokenId, signature, {from:buyer, value:web3.utils.toWei(sendPrice, 'ether')});
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisher)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // checking stakeholders balance

    let sellerAmount = web3.utils.toBN(web3.utils.toWei(sendPrice, 'ether') * (1 - ((creatorFee + publisherFee) / 10000)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sendPrice, 'ether') * (publisherFee/10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sendPrice, 'ether') * (creatorFee/10000));

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
    assert.equal(signatureWord.localeCompare("I am Confused"), 0, "Token memo should be same memo that artist send"); // check token memo
    
    // second user
    let secondUserSig = String(tokenSignature.substring(106, 210)).toLowerCase();
    tokenSignatureAccount = "0x"+String(secondUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = secondUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
        
    assert.equal(tokenSignatureAccount, String(collectorA).toLowerCase(), "Token account should be same account of buyer");
    assert.equal(signatureWord.localeCompare("test"), 0, "Token memo should be same memo that buyer send"); // check token memo*/

    // third user
    let thirdUserSig = String(tokenSignature.substring(210, 316)).toLowerCase();
    tokenSignatureAccount = "0x"+String(thirdUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = thirdUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
        
    assert.equal(tokenSignatureAccount, String(collectorB).toLowerCase(), "Token account should be same account of buyer");
    assert.equal(signatureWord.localeCompare(stringSig), 0, "Token memo should be same memo that buyer send"); // check token memo*/


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

function hashNFTPresale(sellingPrice, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee,publisherFeeFirstSale) {
    return web3.utils.soliditySha3(
      {t: 'uint248', v:sellingPrice},
      {t: 'uint256', v: tokenId}, 
      {t: 'address', v:creatorAccount},
      {t: 'uint16', v:creatorFee},
      {t: 'bool', v:allowSignature},
      {t: 'bytes32', v:creatorSignature},
      {t: 'uint16', v:publisherFee},
      {t: 'uint16', v:publisherFeeFirstSale}
    );
}