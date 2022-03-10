require('dotenv').config();

var HoloNFT = artifacts.require(process.env.PATH_TO_HOLONFT_CONTRACTS + "HoloNFT.sol");
var MorpheusMarket = artifacts.require(process.env.PATH_TO_HOLONFT_CONTRACTS + "MorpheusMarket.sol");

module.exports = function(deployer) {

  deployer.deploy(HoloNFT).then(function() 
  {
    return deployer.deploy(MorpheusMarket, HoloNFT.address);
  });
};