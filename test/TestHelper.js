
function hashNFTPresale(sellingPrice, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee, publisherFeeFirstSale) {
    return web3.utils.soliditySha3(
        { t: 'uint248', v: sellingPrice },
        { t: 'uint256', v: tokenId },
        { t: 'address', v: creatorAccount },
        { t: 'uint16', v: creatorFee },
        { t: 'bool', v: allowSignature },
        { t: 'bytes32', v: creatorSignature },
        { t: 'uint16', v: publisherFee },
        { t: 'uint16', v: publisherFeeFirstSale });
}


function hashNFTDrop(toAccount, tokenId, creatorAccount, creatorFee, allowSignature, creatorSignature, publisherFee) {
    return web3.utils.soliditySha3(
        { t: 'address', v: toAccount },
        { t: 'uint256', v: tokenId },
        { t: 'address', v: creatorAccount },
        { t: 'uint16', v: creatorFee },
        { t: 'bool', v: allowSignature },
        { t: 'bytes32', v: creatorSignature },
        { t: 'uint16', v: publisherFee });
}

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

  function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  }