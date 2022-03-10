pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

/*
Token supply: 3,000,000,000 tokens

Todo:
- Apply supply cap
- set accessor/mutator method to liquiditiy pool and estate dev pool
- handle trancation fee and allocate it to 3 channels

*/

contract Denarii is Ownable, ERC20Burnable, ERC20Pausable, ERC20Snapshot {

    address private liquidityPool;
    address private estateDevPool;

    constructor(address totalSupplyTo) public ERC20("Denarii", "DEN") {
        liquidityPool = _msgSender();
        estateDevPool = _msgSender();
        _mint(totalSupplyTo, 3000000000);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Pausable, ERC20Snapshot) {
        //Every transacction:
        // - 1% go to liquidity pool
        // - 1% go to the estate development pool
        // - 1% burn
        super._beforeTokenTransfer(from, to, amount);

    }

    // Pausable 

    function pause() public onlyOwner whenNotPaused {
        super._pause();
    }

    function unpause() public onlyOwner whenPaused {
        super._unpause();
    }

    // Snapshot

    function snapshot() public onlyOwner returns (uint256) {
        return super._snapshot();
    }

    // Accessor and mutators

    function setLiquidityPool(address payable account) external onlyOwner {
        require(account != address(0), "Account is NULL");
        liquidityPool = account;
    }

    function getLiquidityPool() public view returns (address) {
        return liquidityPool;
    }

    function setEstateDevPool(address payable account) external onlyOwner {
        require(account != address(0), "Account is NULL");
        estateDevPool = account;
    }

    function getEstateDevPool() public view returns (address) {
        return estateDevPool;
    }
}
