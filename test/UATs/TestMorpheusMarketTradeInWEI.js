const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

// STATUS: DONE

contract("TestMorpheusMarketTradeInWEI", accounts => {

  const TRADE_STATUS_CLOSE = 0;
  const TRADE_STATUS_SELLING = 1;

  var holoNFT;
  var morpheuseMarket;

  var tokenId = 1;
  var creatorFee = 1000; // 10%
  var publisherFee = 250; // 2.5%
  var sellingPrice;

  var publisher = accounts[0];
  var publisherCollector = accounts[8];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var collectorB = accounts[3];
  var collectorC = accounts[4];
  var collectorD = accounts[5];

  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    // set and make sure that the publisher is set correctly
    await holoNFT.setPublisherFeeCollector(publisherCollector);
    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisherCollector, "Publisher is not set correctly.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be a partner.");

  })

  it("publisher mint an nft for collectorA", async () => {

    let stringSig = "I love you 3000";
    let signature = web3.utils.asciiToHex(stringSig);

    let tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, true, signature, publisherFee, { from: publisher });

    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });
    await validateToken(collectorA, tokenId, creator, creatorFee, true, publisherFee);

  })

  it("collectorA put its NFT for sale", async () => {

    sellingPrice = '0.15'; //Eth

    //Publisher put collectorA's NFT on sale
    await holoNFT.approve(morpheuseMarket.address, tokenId, {from: collectorA});
    let tx = await morpheuseMarket.openTrade(tokenId, web3.utils.toWei(sellingPrice, 'ether'), { from: collectorA });
    console.log(await holoNFT.getTok)
    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether')) });

  })

  it("collectorB buys collectorA's item (with signature)", async () => {

    let stringSig = "I am Software";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorB;
    let seller = collectorA;

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.executeTrade(tokenId, signature, {from:buyer, value:web3.utils.toWei(sellingPrice, 'ether')});
    // truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_CLOSE), price: web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether')) });
    await validateToken(buyer,tokenId,creator,creatorFee,true,publisherFee);

    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // checking stakeholders balance

    let sellerAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (1 - ((creatorFee + publisherFee) / 10000)));
    let publisherAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (publisherFee/10000));
    let creatorAmount = web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether') * (creatorFee/10000));

    //for show data
    /*console.log("sellerBalance: " + web3.utils.fromWei(sellerBalance, 'ether'));
    console.log("publisherBalance: " + web3.utils.fromWei(publisherBalance, 'ether'));
    console.log("creatorBalance: " + web3.utils.fromWei(creatorBalance, 'ether'));
    console.log("newSellerBalance: " + web3.utils.fromWei(newSellerBalance, 'ether'));
    console.log("newPublisherBalance: " + web3.utils.fromWei(newPublisherBalance, 'ether'));
    console.log("newCreatorBalance: " + web3.utils.fromWei(newCreatorBalance, 'ether'));
    console.log("sellerAmount: " + web3.utils.fromWei(sellerAmount, 'ether'));
    console.log("publisherAmount: " + web3.utils.fromWei(publisherAmount, 'ether'));
    console.log("creatorAmount: " + web3.utils.fromWei(creatorAmount, 'ether'));*/

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
    assert.equal(signatureWord.localeCompare("I love you 3000"), 0, "Token memo should be same memo that artist send"); // check token memo

    let secondUserSig = String(tokenSignature.substring(106, 210)).toLowerCase();
    tokenSignatureAccount = "0x"+String(secondUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = secondUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
    
    assert.equal(tokenSignatureAccount, String(collectorB).toLowerCase(), "Token account should be same account of artist");
    assert.equal(signatureWord.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo*/

  })

  it("collectorB put its NFT for sale", async () => {

    sellingPrice = '0.25'; //Eth

    //Publisher put collectorA's NFT on sale
    await holoNFT.approve(morpheuseMarket.address, tokenId, {from: collectorB});
    let tx = await morpheuseMarket.openTrade(tokenId, web3.utils.toWei(sellingPrice, 'ether'), { from: collectorB });
    console.log(await holoNFT.getTok)
    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether')) });

  })

  it("collectorC buys collectorB's item (with signature) and send over price", async () => {

    let stringSig = "nut4214";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorC;
    let seller = collectorB;
    let sendPrice = '1'; //Eth

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    await morpheuseMarket.executeTrade(tokenId, signature, {from:buyer, value:web3.utils.toWei(sendPrice, 'ether')});
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
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
    assert.equal(signatureWord.localeCompare("I love you 3000"), 0, "Token memo should be same memo that artist send"); // check token memo

    // second user
    let secondUserSig = String(tokenSignature.substring(106, 210)).toLowerCase();
    tokenSignatureAccount = "0x"+String(secondUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = secondUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
    
    assert.equal(tokenSignatureAccount, String(collectorB).toLowerCase(), "Token account should be same account of artist");
    assert.equal(signatureWord.localeCompare("I am Software"), 0, "Token memo should be same memo that artist send"); // check token memo*/

    // third user
    let thirdUserSig = String(tokenSignature.substring(210, 314)).toLowerCase();
    tokenSignatureAccount = "0x"+String(thirdUserSig.substring(0, 40)).toLowerCase();
    tokenSignatureWord = thirdUserSig.substring(40); // 106 = 42 + 64
    signatureWord = hex_to_ascii(tokenSignatureWord);
    
    assert.equal(tokenSignatureAccount, String(collectorC).toLowerCase(), "Token account should be same account of artist");
    assert.equal(signatureWord.localeCompare(stringSig), 0, "Token memo should be same memo that artist send"); // check token memo*/

  })

  it("collectorC put its NFT for sale", async () => {

    sellingPrice = '0.03'; //Eth

    //Publisher put collectorA's NFT on sale
    await holoNFT.approve(morpheuseMarket.address, tokenId, {from: collectorC});
    let tx = await morpheuseMarket.openTrade(tokenId, web3.utils.toWei(sellingPrice, 'ether'), { from: collectorC });
    console.log(await holoNFT.getTok)
    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(web3.utils.toWei(sellingPrice, 'ether')) });

  })

  it("collectorD buys collectorC's item (with signature) and send zero price", async () => {

    let stringSig = "I am a thief";
    let signature = web3.utils.asciiToHex(stringSig);
    let buyer = collectorD;

    let sendPrice = '0'; //Eth
    await truffleAssert.reverts(morpheuseMarket.executeTrade(tokenId, signature, {from:buyer, value:web3.utils.toWei(sendPrice, 'ether')}), "msg.value is lower");
})

it("collectorD buys collectorC's item (with signature) and send lower price", async () => {

  let stringSig = "I don't have money";
  let signature = web3.utils.asciiToHex(stringSig);
  let buyer = collectorD;

  let sendPrice = '0.02'; //Eth
  await truffleAssert.reverts(morpheuseMarket.executeTrade(tokenId, signature, {from:buyer, value:web3.utils.toWei(sendPrice, 'ether')}), "msg.value is lower");
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

function hex_to_ascii(str1) 
{
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}