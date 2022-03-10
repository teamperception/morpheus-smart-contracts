const HoloNFT = artifacts.require("HoloNFT");
const truffleAssert = require('truffle-assertions');

contract("TestPurchase", accounts => {

    let publicsherFee = 3;
    let creatorFee = 10;

    let eth = 1000000000000000000;
    let tokenId = 1;

    let publicsherAccount = accounts[0];
    let creatorAccount = accounts[1];

    it("mintHoloNFTWithPrice", async () => {

        let tokenHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a03";
        let initialPrice = 1000000000000000000;
        const memo = web3.utils.asciiToHex(0);  // convert string to bytes32
    
        const holoNFT = await HoloNFT.deployed();
        let tx = await holoNFT.mintTo(creatorAccount, tokenId, tokenHash, creatorAccount, creatorFee, web3.utils.toBN(initialPrice),memo, { from: publicsherAccount });
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: creatorAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let tokenPrice = await holoNFT.getTokenPrice(tokenId);
        const mintedCreatorFee = await holoNFT.getTokenCreatorFee(tokenId);
    
        assert.equal(tokenPrice, initialPrice, "Token price and price should be same");
        assert.equal(mintedCreatorFee, creatorFee, "Creator fee is not correct.");
    })

    it("purchaseTokenFristSell", async () => {

        let buyerAccount = accounts[2];
        let sendMoney = 1000000000000000000;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32
        
        const initBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const initSellerBalance = await web3.eth.getBalance(creatorAccount);
        const initPublisherBalance = await web3.eth.getBalance(publicsherAccount);
    
        let tx = await holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)});

        const NowBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const NowSellerBalance = await web3.eth.getBalance(creatorAccount);
        const NowPublisherBalance = await web3.eth.getBalance(publicsherAccount);
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: creatorAccount, to: buyerAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let updatedPublisherBalance = (NowPublisherBalance - initPublisherBalance)/eth;
        let updatedSellerBalance = (NowSellerBalance - initSellerBalance)/eth;

        let publisherAmount = (sendMoney * publicsherFee / 100)/eth;
        let sellerAmount = (sendMoney / eth)- publisherAmount;

        console.log("Buyer use Eth in First buy", (initBuyerBalance - NowBuyerBalance)/eth);

        assert.equal(publisherAmount, updatedPublisherBalance, "Publisher balances are not correct");
        assert.equal(sellerAmount, updatedSellerBalance, "Seller balances are not correct");
    
    })

    it("purchaseTokenSecondSell", async () => {

        let sellerAccount = accounts[2];
        let buyerAccount = accounts[3];
        let sendMoney = 1000000000000000000;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32
        
        const initBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const initSellerBalance = await web3.eth.getBalance(sellerAccount);
        const initPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const initCreatorBalance = await web3.eth.getBalance(creatorAccount);

        let tx = await holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)});

        const NowBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const NowSellerBalance = await web3.eth.getBalance(sellerAccount);
        const NowPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const NowCreatorBalance = await web3.eth.getBalance(creatorAccount);
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: sellerAccount, to: buyerAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let updatedPublisherBalance = (NowPublisherBalance - initPublisherBalance)/eth;
        let updatedSellerBalance = (NowSellerBalance - initSellerBalance)/eth;
        let updatedCreatorBalance = (NowCreatorBalance - initCreatorBalance)/eth;

        let publisherAmount = (sendMoney * publicsherFee / 100)/eth;
        let creatrAmount = (sendMoney * creatorFee / 100)/eth;
        let sellerAmount = (sendMoney / eth) - publisherAmount - creatrAmount;

        console.log("Buyer use Eth in second buy", (initBuyerBalance - NowBuyerBalance)/eth);

        assert.equal(publisherAmount, updatedPublisherBalance, "Publisher balances are not correct");
        assert.equal(sellerAmount, updatedSellerBalance, "Seller balances are not correct");
        assert.equal(creatrAmount, updatedCreatorBalance, "Creator balances are not correct");
    
    })
    
    it("purchaseTokenThirdSellWithBuyOverPrice", async () => {

        let sellerAccount = accounts[3];
        let buyerAccount = accounts[4];
        let sendMoney = 2000000000000000000;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32
        
        const initBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const initSellerBalance = await web3.eth.getBalance(sellerAccount);
        const initPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const initCreatorBalance = await web3.eth.getBalance(creatorAccount);

        let tx = await holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)});

        const NowBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const NowSellerBalance = await web3.eth.getBalance(sellerAccount);
        const NowPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const NowCreatorBalance = await web3.eth.getBalance(creatorAccount);
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: sellerAccount, to: buyerAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let updatedPublisherBalance = (NowPublisherBalance - initPublisherBalance)/eth;
        let updatedSellerBalance = (NowSellerBalance - initSellerBalance)/eth;
        let updatedCreatorBalance = (NowCreatorBalance - initCreatorBalance)/eth;

        let publisherAmount = (sendMoney * publicsherFee / 100)/eth;
        let creatrAmount = (sendMoney * creatorFee / 100)/eth;
        let sellerAmount = (sendMoney / eth) - publisherAmount - creatrAmount;

        console.log("Buyer use Eth in third buy", (initBuyerBalance - NowBuyerBalance)/eth);

        assert.equal(publisherAmount, updatedPublisherBalance, "Publisher balances are not correct");
        assert.equal(sellerAmount, updatedSellerBalance, "Seller balances are not correct");
        assert.equal(creatrAmount, updatedCreatorBalance, "Creator balances are not correct");
    
    })

    it("purchaseTokenFourthSellWithSendZeroValue", async () => {

        let sellerAccount = accounts[4];
        let buyerAccount = accounts[5];
        let sendMoney = 0;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32

        await truffleAssert.reverts(
            holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)}),
            "msg.value is lower"
        );
    })

    it("mintHoloNFTWithPriceAndTokenId2", async () => {

        let tokenHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a03";
        let initialPrice = 1500000000000000000;
        let creatorFee = 0;
        let tokenId = 2;
        const memo = web3.utils.asciiToHex(0);  // convert string to bytes32
    
        const holoNFT = await HoloNFT.deployed();
        let tx = await holoNFT.mintTo(creatorAccount, tokenId, tokenHash, creatorAccount, creatorFee, web3.utils.toBN(initialPrice), memo, { from: publicsherAccount });
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: '0x0000000000000000000000000000000000000000', to: creatorAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let tokenPrice = await holoNFT.getTokenPrice(tokenId);
        const mintedCreatorFee = await holoNFT.getTokenCreatorFee(tokenId);
    
        assert.equal(tokenPrice, initialPrice, "Token price and price should be same");
        assert.equal(mintedCreatorFee, creatorFee, "Creator fee is not correct.");
    })

    it("purchaseTokenId2FirstSell", async () => {

        let buyerAccount = accounts[2];
        let sendMoney = 1500000000000000000;
        let tokenId = 2;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32
        
        const initBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const initSellerBalance = await web3.eth.getBalance(creatorAccount);
        const initPublisherBalance = await web3.eth.getBalance(publicsherAccount);
    
        let tx = await holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)});

        const NowBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const NowSellerBalance = await web3.eth.getBalance(creatorAccount);
        const NowPublisherBalance = await web3.eth.getBalance(publicsherAccount);
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: creatorAccount, to: buyerAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let updatedPublisherBalance = (NowPublisherBalance - initPublisherBalance)/eth;
        let updatedSellerBalance = (NowSellerBalance - initSellerBalance)/eth;

        let publisherAmount = (sendMoney * publicsherFee / 100)/eth;
        let sellerAmount = (sendMoney / eth)- publisherAmount;

        console.log("Buyer use Eth in TokenID 2 First buy", (initBuyerBalance - NowBuyerBalance)/eth);

        assert.equal(publisherAmount, updatedPublisherBalance, "Publisher balances are not correct");
        assert.equal(sellerAmount, updatedSellerBalance, "Seller balances are not correct");
    
    })

    it("purchaseTokenID2SecondSell", async () => {

        let sellerAccount = accounts[2];
        let buyerAccount = accounts[3];
        let sendMoney = 1500000000000000000;
        let tokenId = 2;
        let creatorFee = 0;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32
        
        const initBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const initSellerBalance = await web3.eth.getBalance(sellerAccount);
        const initPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const initCreatorBalance = await web3.eth.getBalance(creatorAccount);

        let tx = await holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)});

        const NowBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const NowSellerBalance = await web3.eth.getBalance(sellerAccount);
        const NowPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const NowCreatorBalance = await web3.eth.getBalance(creatorAccount);
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: sellerAccount, to: buyerAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let updatedPublisherBalance = (NowPublisherBalance - initPublisherBalance)/eth;
        let updatedSellerBalance = (NowSellerBalance - initSellerBalance)/eth;
        let updatedCreatorBalance = (NowCreatorBalance - initCreatorBalance)/eth;

        let publisherAmount = (sendMoney * publicsherFee / 100)/eth;
        let creatrAmount = (sendMoney * creatorFee / 100)/eth;
        let sellerAmount = (sendMoney / eth) - publisherAmount - creatrAmount;

        console.log("Buyer use Eth in TokenID 2 second buy", (initBuyerBalance - NowBuyerBalance)/eth);

        assert.equal(publisherAmount, updatedPublisherBalance, "Publisher balances are not correct");
        assert.equal(sellerAmount, updatedSellerBalance, "Seller balances are not correct");
        assert.equal(creatrAmount, updatedCreatorBalance, "Creator balances are not correct");
    
    })

    it("purchaseTokenID2ThirdSellWithBuyOverPrice", async () => {

        let sellerAccount = accounts[3];
        let buyerAccount = accounts[4];
        let sendMoney = 1500000000000000000;
        let tokenId = 2;
        let creatorFee = 0;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32
        
        const initBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const initSellerBalance = await web3.eth.getBalance(sellerAccount);
        const initPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const initCreatorBalance = await web3.eth.getBalance(creatorAccount);

        let tx = await holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)});

        const NowBuyerBalance = await web3.eth.getBalance(buyerAccount);
        const NowSellerBalance = await web3.eth.getBalance(sellerAccount);
        const NowPublisherBalance = await web3.eth.getBalance(publicsherAccount);
        const NowCreatorBalance = await web3.eth.getBalance(creatorAccount);
    
        truffleAssert.eventEmitted(tx, 'Transfer', { from: sellerAccount, to: buyerAccount, tokenId: web3.utils.toBN(tokenId) });
    
        let updatedPublisherBalance = (NowPublisherBalance - initPublisherBalance)/eth;
        let updatedSellerBalance = (NowSellerBalance - initSellerBalance)/eth;
        let updatedCreatorBalance = (NowCreatorBalance - initCreatorBalance)/eth;

        let publisherAmount = (sendMoney * publicsherFee / 100)/eth;
        let creatrAmount = (sendMoney * creatorFee / 100)/eth;
        let sellerAmount = (sendMoney / eth) - publisherAmount - creatrAmount;

        console.log("Buyer use Eth in third buy", (initBuyerBalance - NowBuyerBalance)/eth);

        assert.equal(publisherAmount, updatedPublisherBalance, "Publisher balances are not correct");
        assert.equal(sellerAmount, updatedSellerBalance, "Seller balances are not correct");
        assert.equal(creatrAmount, updatedCreatorBalance, "Creator balances are not correct");
    
    })

    it("purchaseTokenID2FourthSellWithSendZeroValue", async () => {
        
        let buyerAccount = accounts[5];
        let sendMoney = 0;
        let tokenId = 2;
    
        const holoNFT = await HoloNFT.deployed();
        
        const memo = web3.utils.asciiToHex("new message");  // convert string to bytes32

        await truffleAssert.reverts(
            holoNFT.purchaseToken(tokenId,memo,{from:buyerAccount, value:web3.utils.toBN(sendMoney)}),
            "msg.value is lower"
        );
    })
});