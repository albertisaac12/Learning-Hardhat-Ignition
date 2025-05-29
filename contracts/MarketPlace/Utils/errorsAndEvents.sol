// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

abstract contract errorsAndEvents {
    
 
    event purchase(address indexed owner, uint256 indexed amount, uint256 indexed royalityAmount, address receiver);
    event purchaseSuccessful(address indexed buyer, uint256 indexed value, address indexed seller);
    event refunded(address buyer, address indexed seller, uint256 indexed tokenId, uint256 indexed price);
    event transferred(address indexed owner, address indexed to, uint256 indexed tokenId);
    event tokenAddressChanged(address indexed token);
    event creationsAddressChanged(address indexed creations);
    event nativeCurrencyWithdrawn(uint256 indexed amount);
    event tokenWithdrawn();
    event platFormFeesUpdated(uint256 indexed platFormFees);

    error itemNotListed();
    error invalidBuyer();
    error invalidPrice();
    error invalidQuantity();
    error invalidTimePeriod();
    error invalidAmount();
    error invalidOwner();
    error invalidTokenQuantity();
    error setNonZeroTokenAddress();
    error setNonZeroCreationsAddress();

} 