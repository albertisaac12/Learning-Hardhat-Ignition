// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract dappunkToken is ERC20 {
    constructor() ERC20("Dappunk Token", "Dapp") {
        _mint(msg.sender, 10000000000033333330000000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 9;
    }
}
