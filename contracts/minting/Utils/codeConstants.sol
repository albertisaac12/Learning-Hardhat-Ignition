// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
abstract contract codeConstants { 
    uint256 public platformFee;
    uint256 public pioneerFee;
    bool public uriSuffixEnabled;
    bool public isDeprecated;
    string public uriSuffix;
    string public baseUri;
    string public stealthUri;
    string public name;
    string public symbol;

    // Roles
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 public constant AGENCY_MANAGER_ROLE = keccak256("AGENCY_MANAGER_ROLE");
    bytes32 public constant CONTRACT_APPROVER_ROLE = keccak256("CONTRACT_APPROVER_ROLE");
    bytes32 public constant MINT_VALIDATOR_ROLE = keccak256("MINT_VALIDATOR_ROLE");
    bytes32 public constant REFUND_MANAGER_ROLE = keccak256("REFUND_MANAGER_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant MARKET_PLACE = keccak256("MARKET_PLACE");
    bytes32 public constant DEPRECATE_ROLE = keccak256("DEPRECATE_ROLE");

    // Voucher Struct
    struct NFTVoucher {
        uint256 tokenId;
        uint256 price;
        uint256 quantity;
        uint256 buyerQty;
        uint256 start;
        uint256 end;
        uint96 royalty;
        bool isStealth;
        bool isSbt;
        bytes creator;
        bytes validator;
    }

    // mappings
    mapping(uint256 => bool) public sbt;
    mapping(uint256 => bool) public stealth;
    mapping(address => bool) public approvedContracts;
    mapping(address => bool) public pioneers;
    mapping(address => bool) public supportedTokens; // Supported ERC20 Tokens for payment
    mapping(address => uint256) public agencyFee; // Agency fee
    mapping(uint256 => uint256) public tokenMaxQty; // Total quantity of a token
    mapping(uint256 => uint256) public tokenMintedQty; // Amount of token minted
    mapping(address => address) public agencyCreator; // creator => agency
    mapping(uint256 => address) public creatorRegistry; // Creator of token
}