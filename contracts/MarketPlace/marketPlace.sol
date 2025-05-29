// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {AccessControl, Context} from "@openzeppelin/contracts/access/AccessControl.sol"; // Access control
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol"; // Signature generation
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol"; // Used to verify the signature
import {I1155} from "./Utils/I1155.sol";
import {ERC2771Context, Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {marketPlaceConstants} from "./Utils/codeConstants.sol";
import {errorsAndEvents} from "./Utils/errorsAndEvents.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract metaMarketPlace is marketPlaceConstants, errorsAndEvents, AccessControl, EIP712, ERC2771Context,ReentrancyGuard {

    using SafeERC20 for IERC20;
    using Address for address payable;

    IERC20 public punk;
    I1155 public nft;
   
    receive() external payable {}


    constructor(address m1155, uint256 _platformFees, address refundManager , address relayer, address manager, address forwarder)
        EIP712("dappunkMarketPlace", "1")
        ERC2771Context(forwarder)
    {
        nft = I1155(m1155);
        platformFees = _platformFees;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, relayer);
        _grantRole(REFUND_MANAGER_ROLE,refundManager);
        _grantRole(MANAGER_ROLE,manager);
        _grantRole(RELAYER_ROLE, forwarder);
    }

    

    function verifySignature(marketPlaceVoucher calldata Voucher, purchaseVoucher calldata Pvoucher) public view {
        if (!Voucher.isListed) revert itemNotListed();
        if (block.timestamp > Pvoucher.validUntil || Voucher.end < Voucher.start || Voucher.end < block.timestamp || block.timestamp < Voucher.start) revert invalidTimePeriod(); 
        if (Voucher.price == 0) revert invalidPrice();
        if (Voucher.quantity == 0 || Pvoucher.quantity == 0 || Pvoucher.quantity > Voucher.quantity) revert invalidQuantity();

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "marketPlaceVoucher(address listingAddress,uint256 tokenId,uint256 quantity,uint256 price,uint256 listedIn,uint256 start,uint256 end,bool isListed)"
                    ),
                    Voucher.listingAddress,
                    Voucher.tokenId,
                    Voucher.quantity,
                    Voucher.price,
                    Voucher.listedIn,
                    Voucher.start,
                    Voucher.end,
                    Voucher.isListed
                )
            )
        );

        address owner = ECDSA.recover(digest, Voucher.ownerSignature);
        if (owner != Voucher.listingAddress) revert invalidOwner();

        bytes32 digest2 = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "purchaseVoucher(address buyerAddress,uint256 purchaseId,uint256 quantity,uint256 validUntil,uint256 USDprice,uint256 txnFees,uint256 purchasingIn)"
                    ),
                    Pvoucher.buyerAddress,
                    Pvoucher.purchaseId,
                    Pvoucher.quantity,
                    Pvoucher.validUntil,
                    Pvoucher.USDprice,
                    Pvoucher.txnFees,
                    Pvoucher.purchasingIn
                )
            )
        );

        address buyer = ECDSA.recover(digest2, Pvoucher.buyerSignature);
        if (buyer != Pvoucher.buyerAddress) revert invalidBuyer();
    }


    function purchaseNative(marketPlaceVoucher calldata Voucher, purchaseVoucher calldata Pvoucher) external payable nonReentrant {
        if(nft.balanceOf(Voucher.listingAddress,Voucher.tokenId) < Voucher.quantity) revert invalidTokenQuantity();
        verifySignature(Voucher, Pvoucher);
        uint256 price;
        if (Voucher.listedIn == 2 && Pvoucher.purchasingIn == 1) {
            if (msg.value != ((Pvoucher.USDprice) + (platformFees) + (Pvoucher.txnFees))) revert invalidAmount();
            price = Pvoucher.USDprice;
        } else {
            if (msg.value != ((Voucher.price) + (platformFees) + (Pvoucher.txnFees))) revert invalidAmount();
            price = Voucher.price;
        }
        payable(Voucher.listingAddress).sendValue(price);

        nft.setApprovalForAll(Voucher.listingAddress, true);
        nft.safeTransferFrom(
            Voucher.listingAddress, Pvoucher.buyerAddress, Pvoucher.purchaseId, Pvoucher.quantity, ""
        );
        nft.setApprovalForAll(Voucher.listingAddress, false);
        (address owner, uint256 royality) = nft.royaltyInfo(Voucher.tokenId, price);
        payable(owner).sendValue(royality);

        emit purchaseSuccessful(Pvoucher.buyerAddress, msg.value, Voucher.listingAddress);
    }


    function purchasePunk(marketPlaceVoucher calldata Voucher, purchaseVoucher calldata Pvoucher)
        external
        nonReentrant onlyRole(RELAYER_ROLE)
    {
        if(nft.balanceOf(Voucher.listingAddress,Voucher.tokenId) < Voucher.quantity) revert invalidTokenQuantity();
        verifySignature(Voucher, Pvoucher);
 
        punk.safeTransferFrom(Pvoucher.buyerAddress, address(this), ((Voucher.price) + (platformFees)));

        nft.setApprovalForAll(Voucher.listingAddress, true);
        nft.safeTransferFrom(
            Voucher.listingAddress, Pvoucher.buyerAddress, Pvoucher.purchaseId, Pvoucher.quantity, ""
        );
        nft.setApprovalForAll(Voucher.listingAddress, false);
        (address owner, uint256 royality) = nft.royaltyInfo(Voucher.tokenId, Voucher.price);
        punk.transfer(owner, royality);

        punk.transferFrom(address(this), Voucher.listingAddress, Voucher.price);
        emit purchaseSuccessful(
            Pvoucher.buyerAddress, (Voucher.price) + (platformFees) + (Pvoucher.txnFees), Voucher.listingAddress
        );
    }

     function purchaseUSD(marketPlaceVoucher calldata Voucher, purchaseVoucher calldata Pvoucher)
        external
        nonReentrant onlyRole(RELAYER_ROLE)
    {
        if(nft.balanceOf(Voucher.listingAddress,Voucher.tokenId) < Voucher.quantity) revert invalidTokenQuantity();
        verifySignature(Voucher, Pvoucher);
        address owner;
        uint256 royality;

        nft.setApprovalForAll(Voucher.listingAddress, true);
        nft.safeTransferFrom(
            Voucher.listingAddress, Pvoucher.buyerAddress, Pvoucher.purchaseId, Pvoucher.quantity, ""
        );
        nft.setApprovalForAll(Voucher.listingAddress, false);
        (owner, royality) = nft.royaltyInfo(Voucher.tokenId, Voucher.price);

        emit purchase(Voucher.listingAddress, Voucher.price, Pvoucher.USDprice, owner);
        emit purchaseSuccessful(
            Pvoucher.buyerAddress, (Voucher.price) + (platformFees) + (Pvoucher.txnFees), Voucher.listingAddress
        );
    }

    function withdrawNative(address payable to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 bal = address(this).balance;
        emit nativeCurrencyWithdrawn(bal);
        to.sendValue(bal);
    }

    function withdrawToken(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit tokenWithdrawn();
        punk.safeTransferFrom(address(this),to, punk.balanceOf(address(this)));
    }

    function refund(refundVoucher calldata Rvoucher) external onlyRole(REFUND_MANAGER_ROLE) {
        
        address buyer  = Rvoucher.buyer;
        address seller = Rvoucher.seller;
        nft.setApprovalForAll(buyer, true);
        nft.safeTransferFrom(buyer, seller, Rvoucher.tokenId, Rvoucher.quantity, "");
        nft.setApprovalForAll(buyer, false);

        emit refunded(buyer, seller, Rvoucher.tokenId, Rvoucher.price);
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        if (isTrustedForwarder(msg.sender)) {
            return ERC2771Context._msgSender();
        } else {
            return Context._msgSender();
        }
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return ERC2771Context._msgData();
        } else {
            return Context._msgData();
        }
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        if (isTrustedForwarder(msg.sender)) {
            return ERC2771Context._contextSuffixLength();
        } else {
            return Context._contextSuffixLength();
        }
    }


    function setTokenAddress(address token)  external onlyRole(MANAGER_ROLE) {
        if(token == address (0)) revert setNonZeroTokenAddress();
        emit tokenAddressChanged(token);
        punk = IERC20(token);
    }

    function setCreationsAddress(address creations) external onlyRole(MANAGER_ROLE) {
        if(creations == address (0)) revert setNonZeroCreationsAddress();
        emit creationsAddressChanged(creations);
        nft = I1155(creations);
    }

    function updatePlatFormFees(uint256 _platformFees) external onlyRole(MANAGER_ROLE) {
        emit platFormFeesUpdated(platformFees);
        platformFees = _platformFees;
    }

}
