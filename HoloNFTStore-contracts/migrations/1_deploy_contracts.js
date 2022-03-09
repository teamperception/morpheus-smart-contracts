var HoloNFT = artifacts.require("./HoloNFT.sol");
var MorpheusMarket = artifacts.require("./MorpheusMarket.sol");

module.exports = function(deployer) {

  deployer.deploy(HoloNFT).then(function() 
  {
    return deployer.deploy(MorpheusMarket, HoloNFT.address);
  });
};