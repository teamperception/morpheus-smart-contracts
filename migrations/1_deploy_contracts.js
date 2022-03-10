require('dotenv').config();

var HoloNFT = artifacts.require("HoloNFT");
var MorpheusMarket = artifacts.require("MorpheusMarket");

module.exports = function(deployer) {

  deployer.deploy(HoloNFT).then(function() 
  {
    return deployer.deploy(MorpheusMarket, HoloNFT.address);
  });
};