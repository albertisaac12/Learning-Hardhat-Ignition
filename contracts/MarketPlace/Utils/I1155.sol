// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;
interface I1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes memory data) external;
    function setApprovalForAll(address operator, bool approved) external;
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256);
    function refundNFT(uint256 tokenId, address creator, address owner, uint256 qty) external;
    function balanceOf(address account, uint256 id) external returns(uint256);
}
