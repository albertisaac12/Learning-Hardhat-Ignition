// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

abstract contract marketPlaceConstants {

    uint256 public platformFees; // Common fees

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant REFUND_MANAGER_ROLE = keccak256("REFUND_MANAGER_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    /// @dev Struct to hold marketplace voucher details
    struct marketPlaceVoucher {
        address listingAddress; // Currently we do not need the collection ID
        uint256 tokenId; // Unique to each NFT or Batch
        uint256 quantity; // 1 if it's NFT, else 1155
        uint256 price; // Cost of the sale, excludes platform fees
        uint256 listedIn;
        uint256 start; // Time of sale start
        uint256 end; // Time of sale end
        bool isListed; // True if listed for purchase, false if sold or not listed
        bytes ownerSignature; // Purchase ID
    }

    /// @dev Struct to hold purchase voucher details
    struct purchaseVoucher {
        address buyerAddress;
        uint256 purchaseId;
        uint256 quantity;
        uint256 validUntil;
        uint256 USDprice; // ETH to USD price
        uint256 txnFees;
        uint256 purchasingIn;
        bytes buyerSignature;
    }

    /// @dev Struct to hold refund voucher details
    struct refundVoucher {
        address buyer;
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 quantity;
    }

    struct transferVoucher {
        address owner; // token owner
        address to; // address transfering to
        uint256 tokenId; // unique tokenId
        uint256 quantity; // token quantity
        bytes ownerSignature;
    }
} 