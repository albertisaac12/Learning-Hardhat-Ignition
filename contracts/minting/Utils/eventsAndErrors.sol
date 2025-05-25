// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
abstract contract eventsAndErrors {
    event Minted(address indexed creator, uint256 indexed tokenId, uint256 quantity, address indexed buyer);
    event Burnt(uint256 indexed tokenId, uint256 quantity);
    event Refunded(uint256 indexed tokenId, address indexed from, uint256 qty);
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    event Masked(uint256 tokenId);
    event AmountTransferred(uint256 amountToSend,address creator);
    event AmountTransferredToAgency(uint256 agencyAmount,address agencyWallet);
    event BaseUriUpdated();
    event StealthUriUpdated();
    event UriSuffixUpdated();
    event UriSuffixToggled();
    event PioneerAdded(address pioneer);
    event AgencyAdded(address agency,uint256 fee);
    event AgencyCreatorAdded(address creator);
    event ApprovedContractAdded(address contractAddress);
    event RemoveApprovedContract(address contractAddress);
    event ContractDeprecated();
    event ContractRevived();
    event SupportedTokenAdded(address tokenAddress);
    event SupportedTokenRemoved(address tokenAddress);
    event FundsWithdrawn();


    error InvalidValidator(address sender);
    error AlreadyAdded(address account);
    error Deprecated();
    error InsufficientBalance();
    error InvalidPrice(uint256 tokenId, uint256 price);
    error InvalidCreator(address sender);
    error NonTransferableToken();
    error NotSupported(address account);
    error NotTokenCreator(address creator, uint256 tokenId);
    error NotTokenOwner(address wallet, uint256 tokenId, uint256 qty);
    error TransferError();
    error TokenSaleNotStarted(uint256 tokenId, uint256 start, uint256 now);
    error TokenSaleEnded(uint256 tokenId, uint256 end, uint256 now);
    error InvalidTokenQty(uint256 tokenId, uint256 expected, uint256 actual);
    error InvalidRole();
}
