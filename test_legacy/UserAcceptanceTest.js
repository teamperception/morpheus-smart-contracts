const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

contract("UserAcceptanceTest", accounts => {

  var tokenId = 1;

  it("setPublisherFee", async () => {

    const holoNFT = await HoloNFT.deployed();
    let publisherFee = 3;

    await holoNFT.setPublisherFee(tokenId,web3.utils.toBN(publisherFee));
    let newPublisherFee = await holoNFT.getPublisherFee(tokenId);

    assert.equal(newPublisherFee, publisherFee, "Publisher fee should be same");

  })

  it("mintHoloNFTAndSendToArtist", async () => {

    let targetOwner = accounts[1];
    let tokenURI = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a91";
    let creator = accounts[1];
    let creatorFee = 10;
    var message = "Hello HoloNFT";
    let memo = web3.utils.asciiToHex(message);  // convert string to bytes32

    const holoNFT = await HoloNFT.deployed();
    let tx = await holoNFT.mintTo(targetOwner, tokenId, tokenURI, creator, creatorFee, memo, { from: accounts[0] });
    
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: targetOwner, tokenId: web3.utils.toBN(tokenId) });

    let ownerOfToken = await holoNFT.ownerOf(tokenId)
    
    let TokenMemo = await holoNFT.getTokenMemo(tokenId);
    let TokenMemoGetAccount = String(TokenMemo.substring(0, 42)).toLowerCase();
    let TokenMemoGetMemo = TokenMemo.substring(42, TokenMemo.length); // 64 + 42
    let word = hex_to_ascii(TokenMemoGetMemo);
    
    assert.equal(ownerOfToken, targetOwner, "Target owner should be the owner of this token id"); // targetOwner receive tokenID
    assert.equal(TokenMemoGetAccount, String(targetOwner).toLowerCase(), "Token account should be same account of artist");
    assert.equal(word.localeCompare(message), 0, "Token memo should be same memo that artist send"); // check token memo
  
  })

  it("changeBaseURI", async () => {

    const holoNFT = await HoloNFT.deployed();
    let newBaseURI = "https://www.morpheus.art/";

    await holoNFT.setBaseURI(newBaseURI);
    let baseURI = await holoNFT.baseURI()

    assert.equal(baseURI, newBaseURI, "Base URI should be same new base URI");

  })

  it("changeTokenURI", async () => {

    const holoNFT = await HoloNFT.deployed();
    let newTokenURI = "beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await holoNFT.setTokenURI(tokenId, newTokenURI);
    let tokenURI = await holoNFT.tokenURI(tokenId);
    let baseURI = await holoNFT.baseURI();

    let baseURIAndtokenURI = baseURI.concat(newTokenURI);

    assert.equal(tokenURI, baseURIAndtokenURI, "Token URI should be same new token URI");

  })

  it("setBackupURI", async () => {

    const holoNFT = await HoloNFT.deployed();
    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";

    await holoNFT.setBackupURIs(tokenId, backupURI, { from: accounts[1] });

    let getBackupURI = await holoNFT.getBackupURI(tokenId);

    assert.equal(getBackupURI, backupURI, "Token backup URI should be same");

  })

  it("openSellToken", async () => {

    const morpheusMarket = await MorpheusMarket.deployed();
    let price = "1000000000000000000";
    let priceEth = web3.utils.fromWei(web3.utils.toBN(price), "ether" );

    let tx = await morpheusMarket.openTrade(tokenId, priceEth, { from: accounts[1] });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange');

    let tokenPrice = await morpheusMarket.getTrade(tokenId);

    assert.equal(tokenPrice[0].toString(), 1, "Status should be 1");
    assert.equal(tokenPrice[1].toString(), priceEth, "Token price  should be same");

  })

  it("getTokenDetail", async () => {

    let price = "1000000000000000000";
    let priceEth = web3.utils.fromWei(web3.utils.toBN(price), "ether" );
    let tokenURI = "https://www.morpheus.art/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";
    let creator = accounts[1];
    let creatorFee = 10;
    var message = "Hello HoloNFT";
    let backupURI = "www.backupuri.com/beec30ef59d1a05772344705b870437cf66cce25f6218ce469e66cbbba141eb4";


    const holoNFT = await HoloNFT.deployed();
    const morpheusMarket = await MorpheusMarket.deployed();

    let tokenPrice = await morpheusMarket.getTrade(tokenId);
    assert.equal(tokenPrice[0].toString(), 1, "Status should be 1");
    assert.equal(tokenPrice[1].toString(), priceEth, "Token price  should be same");

    let token = await holoNFT.getTokenDetail(tokenId);
    let tokenOwner = await holoNFT.ownerOf(tokenId);
    let publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();

    assert.equal(publisherAddress, accounts[0], "Publisher address should be same");
    assert.equal(token[5].toString(), backupURI, "Token backup URI should be same");
    assert.equal(token[4].toString(), creatorFee, "Token creator fee should be same");
    assert.equal(token[3].toString(), creator, "Token creator address should be same");
    assert.equal(token[2].toString(), tokenOwner, "Token owner should be same");
    assert.equal(token[0].toString(), tokenURI, "Token URI should be same");

  })

  it("buyToken", async () => {

  })

  it("cancelSellToken", async () => {

    const morpheusMarket = await MorpheusMarket.deployed();

    let tx = await morpheusMarket.cancelTrade(tokenId, { from: accounts[1] });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange');

    let tokenPrice = await morpheusMarket.getTrade(tokenId);

    assert.equal(tokenPrice[0].toString(), 0, "Status should be 0");

  })

  it("burnToken", async () => {

    const holoNFT = await HoloNFT.deployed();

    let tokenOwner = await holoNFT.ownerOf(tokenId);
    let tx = await holoNFT.burn(tokenId);
    
    truffleAssert.eventEmitted(tx, 'Transfer');

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
/*
//publisher
mint and send to creator --set memo  +++
burn tokenid
change base uri  +++
change token uri +++
get token detail to show on web -- how many token, price, memo, owner address, creator address, creator fee +++
//token owner
set backup uri +++
open sell for tokenid and check memo 1st +++
cancle sell +++
//buyer
buy tokenid 2 times and checkmemo
*/