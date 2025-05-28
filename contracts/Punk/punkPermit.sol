// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "hardhat/console.sol";

/**
 * @title Dappunk Token Contract
 *     @notice This contract implements an upgradeable ERC20 token with burning, pausing, and role-based access control mechanisms.
 */
contract punkToken11 is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Define the roles here
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE"); // can stop the contract in case of emergency
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // can mint tokens to self and to requests
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE"); // can upgrade the logic [msg.sender == owner of contract]
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE"); // the owner of this contract
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE"); // can manage token operations
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE"); // The relayer role
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE"); // The bridging contract will have this role
    bytes32 public constant STAKER_ROLE = keccak256("STAKER_ROLE"); // The staking contract will have this role
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE"); // The GaslessTokenTransfer contract will have this role
    bytes32 public constant MARKET_PLACE = keccak256("MARKET_PLACE"); // Grant this role to the MarketPlace Contract
    bytes32 public constant GIFTING = keccak256("GIFTING");

    // Tokenomics
    uint256 public maxSupply;

    mapping(address => uint256) public amountBurned; // Tracks the amount that a particular address burned

    /**
     * @notice Emitted when a transaction occurs.
     * @param from The address initiating the transaction.
     * @param to The address receiving the tokens.
     * @param value The amount of tokens transferred.
     * @param isSponsored Indicates if the transaction is sponsored.
     */
    event Txn(address from, address to, uint256 value, bool isSponsored); // Transaction event

    /**
     * @notice Error for when the maximum supply is reached.
     */
    error maxSupplyReached(); // If Total supply has been reached this will be emitted.

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with the owner's address and initial supply.
     * @param owner The address of the owner.
     * @dev This function will only run once and is not accessible again.
     */
    function initialize(address owner) public initializer {
        __ERC20_init("dappunk", "$PUNK");
        __ERC20Permit_init("test");
        __ReentrancyGuard_init();
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Grant roles to the owner
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(PAUSER_ROLE, owner);
        _grantRole(MINTER_ROLE, owner);
        _grantRole(UPGRADER_ROLE, owner);
        _grantRole(OWNER_ROLE, owner);
        _grantRole(MANAGER_ROLE, owner);
        _grantRole(RELAYER_ROLE, owner);
        _grantRole(BURNER_ROLE, owner);
        _grantRole(TRANSFER_ROLE, owner);
        _grantRole(STAKER_ROLE, owner);
        _grantRole(MARKET_PLACE, owner);
        _grantRole(GIFTING, owner);

        maxSupply = 1000000000 * 10 ** decimals();

        // TODO: at launch, mint initial supply according to the Tokenomics
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    /**
     * @notice Pauses all token transfers.
     * @dev Can only be called by an account with the PAUSER_ROLE.
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses all token transfers.
     * @dev Can only be called by an account with the PAUSER_ROLE.
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Mints new tokens.
     * @param to The address to mint the tokens to.
     * @param amount The amount of tokens to mint.
     * @dev Can only be called by an account with the MINTER_ROLE.
     */
    function mint(address to, uint256 amount) public nonReentrant onlyRole(MINTER_ROLE) {
        if (amount + totalSupply() > maxSupply) revert maxSupplyReached();
        _mint(to, amount);
    }

    /**
     * @notice Authorizes a new upgrade (i.e., a new contract implementation).
     * @param newImplementation The address of the new contract implementation.
     * @dev Can only be called by an account with the UPGRADER_ROLE.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @notice Sets the allowance for a spender to spend the caller's tokens.
     * @param spender The address allowed to spend the tokens.
     * @param value The amount of tokens allowed to be spent.
     * @return A boolean indicating whether the operation was successful.
     */
    function approve(address spender, uint256 value) public override nonReentrant returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @notice Updates the balance and other relevant information after a transfer.
     * @param from The address transferring the tokens.
     * @param to The address receiving the tokens.
     * @param value The amount of tokens being transferred.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }

    // TODO: Remove the amountBurned mapping
    /**
     * @notice Burns tokens from the caller's account.
     * @param value The amount of tokens to burn.
     */
    function burn(uint256 value) public override nonReentrant {
        _burn(_msgSender(), value);
        amountBurned[msg.sender] += value;
    }

    // TODO: Remove the amountBurned mapping
    /**
     * @notice Burns tokens from a specified account.
     * @param account The account from which to burn tokens.
     * @param value The amount of tokens to burn.
     */
    function burnFrom(address account, uint256 value) public override nonReentrant {
        address spender = _msgSender();
        if (hasRole(BURNER_ROLE, spender) || hasRole(RELAYER_ROLE, spender)) {
            _burn(account, value);
            amountBurned[account] += value;
        } else {
            _spendAllowance(account, spender, value);
            _burn(account, value);
        }
    }

    // TODO: Remove the Txn event at launch
    /**
     * @notice Transfers tokens to a specified address.
     * @param to The address to transfer the tokens to.
     * @param value The amount of tokens to transfer.
     * @return A boolean indicating whether the operation was successful.
     */
    function transfer(address to, uint256 value) public override nonReentrant returns (bool) {
        super.transfer(to, value);
    }

    // TODO: Emit the Txn event
    /**
     * @notice Transfers tokens from a specified account to another account.
     * @param from The account to transfer tokens from.
     * @param to The account to transfer tokens to.
     * @param value The amount of tokens to transfer.
     * @return A boolean indicating whether the operation was successful.
     */
    function transferFrom(address from, address to, uint256 value) public override nonReentrant returns (bool) {
        address spender = _msgSender();
        // console.log("This is the spender ", spender);
        if (
            hasRole(STAKER_ROLE, spender) || hasRole(BURNER_ROLE, spender) || hasRole(RELAYER_ROLE, spender)
                || hasRole(TRANSFER_ROLE, spender) || hasRole(MARKET_PLACE, spender) || hasRole(GIFTING, spender)
        ) {
            // console.log("Inside IF statement");
            _transfer(from, to, value);
            // console.log("Transfer sucessfull");
        } else {
            // _spendAllowance(from, spender, value);
            // _transfer(from, to, value);
            super.transferFrom(from, to, value);
        }
        return true;
    }

    // TODO: Remove this code below at launch
    /**
     * @notice Exposes the amount burned by a specific address.
     * @param from The address to query.
     * @return The amount burned by the address.
     * @dev This function is for testing purposes and should be removed after testing.
     */
    function exposeAmountBurned(address from) public view returns (uint256) {
        return amountBurned[from];
    }
}
