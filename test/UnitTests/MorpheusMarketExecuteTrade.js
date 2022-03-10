const HoloNFT = artifacts.require("HoloNFT");
const MorpheusMarket = artifacts.require("MorpheusMarket");
const truffleAssert = require('truffle-assertions');

// STATUS: NEED MORE TEST CASES

contract("MorpheusMarketExecuteTrade.js", accounts => {

  const TRADE_STATUS_CLOSE = 0;
  const TRADE_STATUS_SELLING = 1;

  var holoNFT;
  var morpheuseMarket;

  var tokenId = 1;
  var creatorFee = 250; // 2.5%
  var publisherFee = 750; // 7.5%
  var publisherFeeFirstSale = 2000; // 20.00%
  var sellingPriceETH = "1"; //Eth
  var allowSignature = true;

  var publisher = accounts[0];
  var creator = accounts[1];
  var collectorA = accounts[2];
  var collectorB = accounts[3];
  var publisherCollector = accounts[5];

  var stringSig = "Hi World";
  var signature = web3.utils.asciiToHex(stringSig);

  it("setup HoloNFT with publisher market and partner market", async () => {

    holoNFT = await HoloNFT.deployed();
    morpheuseMarket = await MorpheusMarket.deployed();

    // set and make sure that the publisher is set correctly
    await holoNFT.setPublisherFeeCollector(publisherCollector, {from:publisher});
    var publisherAddress = await holoNFT.getPublisherFeeCollectorAddress();
    assert.equal(publisherAddress, publisherCollector, "Publisher is not set correctly.");

    await holoNFT.setOperator(morpheuseMarket.address, true);
    var isPartner = await holoNFT.isOperator(morpheuseMarket.address);
    assert.equal(isPartner, true, "Morpheus market should be a partner.");

  })

  it("Execute trade: Selling price = 0 ETH", async () => {

    sellingPriceETH = "0";
    
    try{
      await mintToken();
      await putOnSale(web3.utils.toWei(sellingPriceETH));
      await executeTrade(web3.utils.toWei(sellingPriceETH));
      assert.equal(true,false);
    }
    catch(e)
    {
      
    }

    await holoNFT.burn(tokenId, {from:publisher});

    
    
  })

  
  it("Execute trade: Selling price = 0.1 ETH", async () => {

    sellingPriceETH = "0.1";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 0.0000001 ETH", async () => {

    sellingPriceETH = "0.0000001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1 ETH", async () => {

    sellingPriceETH = "1";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1.0000001 ETH", async () => {

    sellingPriceETH = "1.0000001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1.1 ETH", async () => {

    sellingPriceETH = "1.1";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1.123123123 ETH", async () => {

    sellingPriceETH = "1.123123123";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 13.00 ETH", async () => {

    sellingPriceETH = "13.00";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 13.0000001 ETH", async () => {

    sellingPriceETH = "13.0000001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 13.001 ETH", async () => {

    sellingPriceETH = "13.001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 99.0001 ETH", async () => {

    sellingPriceETH = "99.0001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 99.001 ETH", async () => {

    sellingPriceETH = "99.001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 99.999 ETH", async () => {

    sellingPriceETH = "99.999";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 999.999 ETH", async () => {

    sellingPriceETH = "999.999";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 123123.001 ETH", async () => {

    sellingPriceETH = "123123.001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1234567890.000 ETH", async () => {

    sellingPriceETH = "1234567890.000";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1234567890.001 ETH", async () => {

    sellingPriceETH = "1234567890.001";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 123456789012345.000 ETH", async () => {

    sellingPriceETH = "123456789012345.000";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })

  it("Execute trade: Selling price = 1234567890123456.000 ETH", async () => {

    sellingPriceETH = "1234567890123456.000";

    await mintToken();
    await putOnSale(web3.utils.toWei(sellingPriceETH));
    await executeTrade(web3.utils.toWei(sellingPriceETH));
    
  })


  async function mintToken()
  {
    let tx = await holoNFT.mintTo(collectorA, tokenId, creator, creatorFee, false, signature, publisherFee, { from: publisher });
    truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: collectorA, tokenId: web3.utils.toBN(tokenId) });
  }

  async function putOnSale(price)
  {
    await holoNFT.approve(morpheuseMarket.address,tokenId, {from: collectorA});
    tx = await morpheuseMarket.openTrade(tokenId, price, { from: collectorA });
    truffleAssert.eventEmitted(tx, 'TradeStatusChange', { tokenId: web3.utils.toBN(tokenId), status: web3.utils.toBN(TRADE_STATUS_SELLING), price: web3.utils.toBN(price) });
  }

  async function executeTrade(price)
  {

    let buyer = collectorB;
    let seller = collectorA;

    let sellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let publisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let creatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    tx = await morpheuseMarket.executeTrade(tokenId,signature,{from:buyer, value:price});
    
    let newSellerBalance = web3.utils.toBN(String(await web3.eth.getBalance(seller)));
    let newPublisherBalance = web3.utils.toBN(String(await web3.eth.getBalance(publisherCollector)));
    let newCreatorBalance = web3.utils.toBN(String(await web3.eth.getBalance(creator)));

    // checking stakeholders balance
    newSellerBalance = newSellerBalance.sub(sellerBalance);
    newPublisherBalance = newPublisherBalance.sub(publisherBalance);
    newCreatorBalance = newCreatorBalance.sub(creatorBalance);

    let checkSum = newSellerBalance.add(newPublisherBalance).add(newCreatorBalance);

    // console.log(checkSum.toString());

    await holoNFT.burn(tokenId, {from:publisher});

    assert.deepEqual(checkSum.toString(), price.toString(), "Price comparison incorrect");
    











    // let publisherAmount = web3.utils.toBN(price*(publisherFee/10000));
    // let creatorAmount = web3.utils.toBN(price*(creatorFee/10000));
    // let sellerAmount = web3.utils.toBN(price).sub(creatorAmount).sub(publisherAmount);

    // await holoNFT.burn(tokenId, {from:publisher});

    // // console.log(newSellerBalance.sub(sellerBalance).toString());
    // // console.log(newPublisherBalance.sub(publisherBalance).toString());
    // // console.log(newCreatorBalance.sub(creatorBalance).toString());
    // // console.log(sellerAmount.toString());
    // // console.log(publisherAmount.toString());
    // // console.log(creatorAmount.toString());

    // assert.deepEqual(sellerBalance.add(sellerAmount).toString(), newSellerBalance.toString(), "collectorA Balance balance incorrect");
    // assert.deepEqual(publisherBalance.add(publisherAmount).toString(), newPublisherBalance.toString(), "publisher Balance balance incorrect");
    // assert.deepEqual(creatorBalance.add(creatorAmount).toString(), newCreatorBalance.toString(), "creator Balance balance incorrect");

  }

});
