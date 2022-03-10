const HoloNFT = artifacts.require("./HoloNFT.sol");
const MorpheusMarket = artifacts.require("./MorpheusMarket.sol");
const truffleAssert = require('truffle-assertions');

contract("TestHackingMorpheusMarket", accounts => {

  const perception = accounts[0];
  const goodUser1 = accounts[1];
  const goodUser2 = accounts[2];

  const badUser1 = accounts[3];
  const badUser2 = accounts[4];

  const goodOperator1 = accounts[5];

  // ***********************
  // Setup
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

  // ***********************
  // Token owner open trade
  // ***********************

  it("Token owner open trade: correctly", async () => {

    const morpheusMarket = await MorpheusMarket.deployed();
    let price = "1000000000000000000";
    let priceEth = web3.utils.fromWei(web3.utils.toBN(price), "ether" );

    let tx = await morpheusMarket.openTrade(tokenId, priceEth, { from: accounts[1] });

    truffleAssert.eventEmitted(tx, 'TradeStatusChange');

    let tokenPrice = await morpheusMarket.getTrade(tokenId);

    assert.equal(tokenPrice[0].toString(), 1, "Status should be 1");
    assert.equal(tokenPrice[1].toString(), priceEth, "Token price  should be same");
    
  })

  it("Token owner open trade: token does not exist", async () => {
  })

  it("Token owner open trade: 0 price", async () => {
  })

  it("Token owner open trade: -1 price", async () => {
  })

  it("Token owner open trade: out of range price", async () => {
  })

  // ***********************
  // Token owner cancel trade
  // ***********************

  it("Token owner cancel trade: correctly", async () => {
  })

  it("Token owner cancel trade: token is not for sell already", async () => {
  })

  it("Token owner cancel trade: token does not exist", async () => {
  })

  // ***********************
  // Bad user try open & cancel trade
  // ***********************

  it("Bad user try open trade: Not token owner", async () => {
  })

  it("Bad user try cancel trade: Not token owner", async () => {
  })

  // ***********************
  // User get trade information
  // ***********************

  it("User get trade information: correctly", async () => {
  })

  it("User get trade information: token is not for sell", async () => {
  })

  it("User get trade information: token does not exist", async () => {
  })

  // ***********************
  // User buy token
  // ***********************

  it("User buy token: correctly with exact amount of ETH", async () => {
  })

  it("User buy token: correctly with too much amount of ETH", async () => {
  })

  it("User buy token: sending not enough ETH", async () => {
  })

  it("User buy token: token is not for sell", async () => {
  })

  it("User buy token: token does not exist", async () => {
  })

  



});
