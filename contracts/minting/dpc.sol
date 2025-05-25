

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC1155,Context} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {eventsAndErrors} from "./Utils/eventsAndErrors.sol";
import {codeConstants} from "./Utils/codeConstants.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract dappunkCreations is eventsAndErrors, codeConstants, ERC1155, ERC2981,ERC2771Context, AccessControl, EIP712,ReentrancyGuard {
    using Address for address payable;
    using SafeERC20 for IERC20;
    using Strings for uint256;
    receive() external payable {

    }

    modifier deprecated() {
        // if (!hasRole(DEPRECATE_ROLE,msg.sender)) revert InvalidRole();
        if (isDeprecated) revert Deprecated();
        _;
    }

    constructor(
        address manager,
        address minter,
        address fundManager,
        address agencyManager,
        address contractApprover,
        address mintValidator,
        address refundManager,
        address forwarder) ERC1155("") EIP712("moshpit","1") ERC2771Context(forwarder)
    {
        baseUri = "NoUrl";
        stealthUri = "StealthUrl";
        platformFee = 1000; // 1000 means 10%
        pioneerFee = 500;
        name = "dpNftV1";
        symbol = "DPN1";

        // Granting Roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, manager);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(FUND_MANAGER_ROLE, fundManager);
        _grantRole(AGENCY_MANAGER_ROLE, agencyManager);
        _grantRole(CONTRACT_APPROVER_ROLE, contractApprover);
        _grantRole(MINT_VALIDATOR_ROLE, mintValidator);
        _grantRole(REFUND_MANAGER_ROLE, refundManager);
        _grantRole(MINTER_ROLE, forwarder);

        // setting Default Royality    
        _setDefaultRoyalty(msg.sender, 1000);
    
    }

    // fix the error names and Add more error names
     function _validateVoucher(NFTVoucher calldata voucher) internal view returns (bool) {

        if (voucher.price <= 0) {
            revert InvalidPrice(voucher.tokenId, voucher.price);
        }
        if (voucher.buyerQty < 1) {
            revert InvalidTokenQty(voucher.tokenId, 69 , voucher.quantity);
        }
        if (voucher.quantity < 1) {
            revert InvalidTokenQty(voucher.tokenId, 69 , voucher.quantity);
        }
        if (voucher.quantity < voucher.buyerQty) {
            revert InvalidTokenQty(voucher.tokenId, 69 , voucher.quantity);
        }
    
        uint256 tokenQty = tokenMaxQty[voucher.tokenId];
        if (tokenQty > 0) {
            uint256 tokensMinted = tokenMintedQty[voucher.tokenId];
            if (tokensMinted + voucher.buyerQty > tokenQty) {
                revert InvalidTokenQty(voucher.tokenId, tokensMinted, tokensMinted + voucher.buyerQty); // Fix the error name here
            }
        }

        return true;
    }

    function _verifySignatures(NFTVoucher calldata voucher) internal view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "NFTVoucher(uint256 tokenId,uint256 price,uint256 quantity,uint256 buyerQty,uint256 start,uint256 end,uint96 royalty,bool isStealth,bool isSbt)"
                    ),
                    voucher.tokenId,
                    voucher.price,
                    voucher.quantity,
                    voucher.buyerQty,
                    voucher.start,
                    voucher.end,
                    voucher.royalty,
                    voucher.isStealth,
                    voucher.isSbt
                )
            )
        );

        address creator = ECDSA.recover(digest, voucher.creator);
        if (voucher.tokenId >> 96 != uint256(uint160(creator))) {
            revert InvalidCreator(creator);
        }

        address validator = ECDSA.recover(digest, voucher.validator);
        if (!hasRole(MINT_VALIDATOR_ROLE, validator)) {
            revert InvalidValidator(validator);
        }

        return creator;
    }

    function verifyVoucher(NFTVoucher calldata voucher) public view returns (address) {
        // Perform general validations
        _validateVoucher(voucher);


        // Verify signatures
        address creator = _verifySignatures(voucher);

        // Timestamp verification
        uint256 _now = block.timestamp;
        if (voucher.start != 0 && _now < voucher.start) {
            revert TokenSaleNotStarted(voucher.tokenId, voucher.start, _now);
        } 
        if (voucher.end != 0 && _now > voucher.end) {
            revert TokenSaleEnded(voucher.tokenId, voucher.end, _now);
        }

        return creator;
    }

    // enable token Qty tracking on the 


    function mint(
        address creator,
        address buyer,
        uint256 tokenId,
        uint96 tokenRoyalty,
        bool isSBT,
        bool isStealth,
        uint256 quantity,
        uint256 buyerQty
    ) private {
     
        // For the first mint
        if (tokenMaxQty[tokenId] == 0) {
            // Mappings init
            tokenMintedQty[tokenId] = 0;
            tokenMaxQty[tokenId] = quantity;

            // Set Token Royalty
            _setTokenRoyalty(tokenId, creator, tokenRoyalty);

            // Track Creator
            creatorRegistry[tokenId] = creator;
            
            // SoulBound Check
            if (isSBT) {
                emit Locked(tokenId);
                sbt[tokenId] = true;
            }

            // Stealth Check
            if (isStealth) {
                emit Masked(tokenId);
                stealth[tokenId] = true;
            }
        }

        // Mint Init
        _mint(buyer, tokenId, buyerQty, "");

        emit Minted(creator, tokenId, buyerQty, buyer);
        
        // Set MintedtokenQty
        tokenMintedQty[tokenId] += buyerQty;
    }

    function fees(uint256 value, bool isPioneer) internal view returns (uint256) {
        if (isPioneer) {
            return ((value * pioneerFee) / _feeDenominator());
        } else {
            return ((value * platformFee) / _feeDenominator());
        }
    }

    function agencyFees(uint256 value, address agency) internal view returns (uint256) {
        return ((value * agencyFee[agency]) / _feeDenominator());
    }

    // Native Minting
    function mintNftNative(NFTVoucher calldata voucher, address buyer) external payable nonReentrant deprecated {
        address creator = verifyVoucher(voucher);
        uint256 price = voucher.price* voucher.buyerQty;
        
        if (msg.value < price) revert InsufficientBalance();

        uint256 fee = fees(price, pioneers[creator]);

        mint(
            creator,
            buyer,
            voucher.tokenId,
            voucher.royalty,
            voucher.isSbt,
            voucher.isStealth,
            voucher.quantity,
            voucher.buyerQty
        );

        uint256 amountToSend = price-fee;
        emit AmountTransferred(amountToSend,creator);
        payable(creator).sendValue(amountToSend);

        address agencyWallet = agencyCreator[creator];
         if (agencyWallet != address(0)) {
            uint256 agencyAmount = agencyFees(price, agencyWallet);
            emit AmountTransferredToAgency(agencyAmount,agencyWallet);
            payable(agencyWallet).sendValue(agencyAmount);
        }
    
    }


    function mintNftWithToken(NFTVoucher calldata voucher, address tokenAddress, address buyer)
        external
        nonReentrant
        deprecated
    {
        if (!supportedTokens[tokenAddress]) revert NotSupported(tokenAddress);
        address creator = verifyVoucher(voucher);
        uint256 price = voucher.price * voucher.buyerQty;
        IERC20 token = IERC20(tokenAddress);

        uint256 fee = fees(price, pioneers[creator]);

      
        token.safeTransferFrom(buyer,address(this),price);

        mint(
            creator,
            buyer,
            voucher.tokenId,
            voucher.royalty,
            voucher.isSbt,
            voucher.isStealth,
            voucher.quantity,
            voucher.buyerQty
        );
        uint256 amountToSend = price-fee;
        emit AmountTransferred(amountToSend,creator);
        token.safeTransfer(creator, amountToSend);

        address agencyWallet = agencyCreator[creator];
        if (agencyWallet != address(0)) {
            uint256 agencyAmount = agencyFees(price, agencyWallet);
            emit AmountTransferredToAgency(agencyAmount,agencyWallet);
            token.safeTransfer(agencyWallet, agencyAmount);
        }
    }


    function mintNft(NFTVoucher calldata voucher, address buyer) external nonReentrant deprecated onlyRole(MINTER_ROLE) {

        address creator = verifyVoucher(voucher);
        mint(
            creator,
            buyer,
            voucher.tokenId,
            voucher.royalty,
            voucher.isSbt,
            voucher.isStealth,
            voucher.quantity,
            voucher.buyerQty
        );
    }


    function mintNftGasless(NFTVoucher calldata voucher, address buyer) external payable nonReentrant deprecated onlyRole(RELAYER_ROLE) {
        address creator = verifyVoucher(voucher);
        uint256 price = voucher.price* voucher.buyerQty;
        
        if (msg.value < price) revert InsufficientBalance();

        uint256 fee = fees(price, pioneers[creator]);

        mint(
            creator,
            buyer,
            voucher.tokenId,
            voucher.royalty,
            voucher.isSbt,
            voucher.isStealth,
            voucher.quantity,
            voucher.buyerQty
        );

        uint256 amountToSend = price-fee;
        emit AmountTransferred(amountToSend,creator);
        payable(creator).sendValue(amountToSend);

        address agencyWallet = agencyCreator[creator];
         if (agencyWallet != address(0)) {
            uint256 agencyAmount = agencyFees(price, agencyWallet);
            emit AmountTransferredToAgency(agencyAmount,agencyWallet);
            payable(agencyWallet).sendValue(agencyAmount);
        }
    
    }



     /* URI MANEGEMENT */
    /// @notice Returns the URI to the token's metadata.
    /// @param tokenId Nft token id.
    function uri(uint256 tokenId) public view override returns (string memory) {
        if (stealth[tokenId]) {
            return bytes(stealthUri).length > 0 ? string(abi.encodePacked(stealthUri)) : "";
        }
        if (!uriSuffixEnabled) {
            return bytes(baseUri).length > 0 ? string(abi.encodePacked(baseUri, tokenId.toString())) : "";
        }
        return bytes(baseUri).length > 0 ? string(abi.encodePacked(baseUri, tokenId.toString(), uriSuffix)) : "";
    }


    /// @notice Update the baseURI.
    /// @param newBaseUri New collection uri.
    function updateBaseUri(string memory newBaseUri) external onlyRole(MANAGER_ROLE) {
        emit BaseUriUpdated();
        baseUri = newBaseUri;
    }

    /// @notice Update stealth NFT URI.
    /// @param newStealthUri New stealth URI.
    function updateStealthUri(string memory newStealthUri) external onlyRole(MANAGER_ROLE) {
        emit StealthUriUpdated();
        stealthUri = newStealthUri;
    }

    /// @notice Update URI's base extention.
    /// @param newSuffix New base uri extention.
    function updateUriSuffix(string memory newSuffix) external onlyRole(MANAGER_ROLE) {
        emit UriSuffixUpdated();
        uriSuffix = newSuffix;
    }

    /// @notice Flips the flag to use UriSuffix.
    function toggleUriSuffix() external onlyRole(MANAGER_ROLE) {
        emit UriSuffixToggled();
        uriSuffixEnabled = !uriSuffixEnabled;
    }

    /* SBT - SOUL BOUND TOKENS - NON TRANSFERABLE */
    function locked(uint256 tokenId) external view returns (bool) {
        if (sbt[tokenId]) return true;
        return false;
    }

     function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        virtual
        override
    {
        for (uint256 i = 0; i < ids.length; ++i) {
            if (to != address(0)) {
                if (sbt[ids[i]] && !hasRole(REFUND_MANAGER_ROLE, msg.sender)) {
                    revert NonTransferableToken();
                }
            }
        }
        return super._update(from, to, ids, values);
    }

    function burn(uint256 tokenId, uint256 quantity) external {
        if (balanceOf(msg.sender, tokenId) < quantity) {
            revert InsufficientBalance();
        }
        _burn(msg.sender, tokenId, quantity);
        tokenMaxQty[tokenId] -= quantity;
        tokenMintedQty[tokenId] -= quantity;
        if (tokenMaxQty[tokenId] == 0) {
            creatorRegistry[tokenId] = address(0);
        }
        emit Burnt(tokenId, quantity);
    }


    function refundNFT(uint256 tokenId, address creator, address owner, uint256 qty)
        external
        onlyRole(REFUND_MANAGER_ROLE)
    {
        if (creatorRegistry[tokenId] != creator) {
            revert NotTokenCreator(creator, tokenId);
        }
        if (balanceOf(owner, tokenId) < qty) {
            revert NotTokenOwner(owner, tokenId, qty);
        }
        safeTransferFrom(owner, creator, tokenId, qty, "");
        emit Refunded(tokenId, owner, qty);
    }

     function isApprovedForAll(address account, address operator) public view override returns (bool) {
        if (approvedContracts[operator]) {
            return true;
        }
        if (hasRole(REFUND_MANAGER_ROLE, operator)) {
            return true;
        }

        return super.isApprovedForAll(account, operator);
    }


     /* PIONEER MANAGEMENT */
    function addPioneer(address pioneer) external onlyRole(AGENCY_MANAGER_ROLE) {
        if (pioneers[pioneer]) revert AlreadyAdded(pioneer);
        emit PioneerAdded(pioneer);
        pioneers[pioneer] = true;
    }

    /* AGENCY MANAGEMENT */
    function addAgency(address agency, uint256 fee) external onlyRole(AGENCY_MANAGER_ROLE) {
        if (agencyFee[agency] > 0) revert AlreadyAdded(agency);
        emit AgencyAdded(agency,fee);
        agencyFee[agency] = fee;
    }

    function addCreator(address agency, address[] memory creators) external onlyRole(AGENCY_MANAGER_ROLE) {
        uint256 i;
        uint256 len = creators.length;
        for (; i <len ; ) {
            // TODO: Maybe convert this to a skip, rather than a revert?
            if (agencyCreator[creators[i]] != address(0)) {
                revert AlreadyAdded(creators[i]);
            }
            emit AgencyCreatorAdded(creators[i]);
            agencyCreator[creators[i]] = agency;

            i++;
        }
    }
    
    function setApprovedContract(address contractAddress) external onlyRole(CONTRACT_APPROVER_ROLE) {
        if (approvedContracts[contractAddress]) {
            revert AlreadyAdded(contractAddress);
        }
        emit ApprovedContractAdded(contractAddress);
        approvedContracts[contractAddress] = true;
    }

    function removeApprovedContract(address contractAddress) external onlyRole(CONTRACT_APPROVER_ROLE) {
        // require(approvedContracts[contractAddress], "DoesntExist: Contract not approved");
        if (!approvedContracts[contractAddress]) {
            revert NotSupported(contractAddress);
        }
        emit RemoveApprovedContract(contractAddress);
        approvedContracts[contractAddress] = false;
    }

    /* FUND MANAGEMENT */

     function addSupportedToken(address tokenAddress) external onlyRole(MANAGER_ROLE) {
        if (supportedTokens[tokenAddress]) revert AlreadyAdded(tokenAddress);
        emit SupportedTokenAdded(tokenAddress);
        supportedTokens[tokenAddress] = true;
    }

    function removeSupportedToken(address tokenAddress) external onlyRole(MANAGER_ROLE) {
        if (!supportedTokens[tokenAddress]) revert NotSupported(tokenAddress);
        emit SupportedTokenRemoved(tokenAddress);
        supportedTokens[tokenAddress] = false;
    }

    function withdraw() external onlyRole(FUND_MANAGER_ROLE) {
        emit FundsWithdrawn();
        payable(msg.sender).sendValue(address(this).balance);
    }

    function withdraw(address tokenAddress) external onlyRole(FUND_MANAGER_ROLE) {
        if (!supportedTokens[tokenAddress]) revert NotSupported(tokenAddress);
        emit FundsWithdrawn();
        IERC20 token = IERC20(tokenAddress);
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }


    /* CONTRACT STATE */
    function deprecate() external deprecated onlyRole(DEFAULT_ADMIN_ROLE) {
        emit ContractDeprecated();
        isDeprecated = true;
    }

    function reviveContract() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit ContractRevived();
        isDeprecated = false;
    }

    // function
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC2981, ERC1155, AccessControl) returns (bool) {
      return super.supportsInterface(interfaceId);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        if (hasRole(MARKET_PLACE, msg.sender)) {
            _setApprovalForAll(operator, msg.sender, approved);
        } else {
            _setApprovalForAll(_msgSender(), operator, approved);
        }
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        if (isTrustedForwarder(msg.sender)) {
            return ERC2771Context._msgSender();
        } else {
            return Context._msgSender();
        }
    }

    function _msgData() internal view override(ERC2771Context, Context) returns (bytes calldata) {
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

}