// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/HoloNFT.sol";

contract TestHackingHoloNFT {

    HoloNFT holoNFT;

    function beforeEach() public {
        // setup parameters here
        holoNFT = HoloNFT(DeployedAddresses.HoloNFT());

    }
}
