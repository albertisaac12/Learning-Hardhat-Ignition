const { ethers } = require("hardhat");

module.exports = Object.freeze({
  roles: {
    RELAYER_ROLE:
      "0xe2b7fb3b832174769106daebcfd6d1970523240dda11281102db9363b83b0dc4",
    DEFAULT_ADMIN_ROLE:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    MARKET_PLACE:
      "0x4201506c6a71f83bd7604006d37c474435301b63f52fc58ab660a4853a23237a",
    MANAGER_ROLE:
      "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08",
    FUND_MANAGER_ROLE:
      "0x0b84ee281e5cf521a9ad54a86fafe78946b157177e231bd8ae785af4d3b3620f",
    REFUND_MANAGER_ROLE:
      "0xc89f08b49c068684bf15b77e68611a9f601e70d1f919059510bccd18e691e535",
  },
  zero: "0x0000000000000000000000000000000000000000000000000000000000000000",
  platformFees: "10000000000000000000",
  txnFees: "100000000000000000",
  domains: {
    name: "dappunkMarketPlace",
    version: "1",
    chainId: 31337,
    verifyingContract: "",
  },
  contracts: {
    metaMarketPlace: {
      file: "contracts/Marketplace/marketPlace.sol:metaMarketPlace",
      functions: {
        verifySignature:
          "verifySignature((address,uint256,uint256,uint256,uint256,uint256,uint256,bool,bytes),(address,uint256,uint256,uint256,uint256,uint256,uint256,bytes))",
        purchaseNative:
          "purchaseNative((address,uint256,uint256,uint256,uint256,uint256,uint256,bool,bytes),(address,uint256,uint256,uint256,uint256,uint256,uint256,bytes))",
        purchasePunk:
          "purchasePunk((address,uint256,uint256,uint256,uint256,uint256,uint256,bool,bytes),(address,uint256,uint256,uint256,uint256,uint256,uint256,bytes))", // ,uint256
        purchaseUSD:
          "purchaseUSD((address,uint256,uint256,uint256,uint256,uint256,uint256,bool,bytes),(address,uint256,uint256,uint256,uint256,uint256,uint256,bytes))",
        withdraw: "withdraw(address)",
        refund: "refund((address,address,uint256,uint256,uint256))", //,uint256
        grantRole: "grantRole(bytes32,address)",
        renounceRole: "renounceRole(bytes32,address)",
        revokeRole: "revokeRole(bytes32,address)",
        hasRole: "hasRole(bytes32,address)",
        mintNft:
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes))",
      },
      Vouchers: {
        nftVoucher: {
          tokenId: ethers.toBigInt(
            "50930204793815341472647614845042490728161331526673935029629296841583988047873"
          ),
          price: ethers.toBigInt("1000000000000000000"),
          start: 0,
          end: ethers.toBigInt("15555555555555555555555555555555555"),
          royalty: 1000,
          isStealth: false,
          isSbt: false,
          creator:
            "0xa4350aefcc8623fb37bb9cd8a2437021cefc589d2e8f5df06845f151fbcba67b20e472b8245df634cb30a49466137986f953356662aa3914b7227448231e37ef1b",
          validator:
            "0xc3d04e8e3a76406fa76060df6d76fca04d9776d6487bcdef587d77bc876f161713212888082e62eb8d1ec805f7158e5f1466a0c81d1faf2e0bf5df7cba3935b91c",
        },
        multiTokenVoucher: {
          tokenId: ethers.toBigInt(
            "50930204793815341472647614845042490728161331526673935029629368898078514413570"
          ),
          price: ethers.toBigInt("1000000000000000000"),
          quantity: 2,
          buyerQty: 2,
          start: 0,
          end: ethers.toBigInt("15555555555555555555555555555555555"),
          royalty: 1000,
          isStealth: false,
          isSbt: false,
          creator:
            "0xc7127d0f2308422d0c5a6bea2b3cc54a7d7a471e816a931227a22f9c1df5f22c341fcc2932b55447cb44f1ee9b815d170e9a50825cae93e5a79475a92b1a9b5d1c",
          validator:
            "0x9bbb02c52d40c066324925639b20bac43bcccc0496b93cf82ee90c33cc3ed28805b1d188904070448bb829eb7be0018f42af53eb2900cb21f6e86b552d16fe4f1c",
        },
      },
      types: {
        ERC721: {
          NFTVoucher: [
            { name: "tokenId", type: "uint256" },
            { name: "price", type: "uint256" },
            { name: "start", type: "uint256" },
            { name: "end", type: "uint256" },
            { name: "royalty", type: "uint96" },
            { name: "isStealth", type: "bool" },
            { name: "isSbt", type: "bool" },
          ],
        },
        ERC1155: {
          NFTVoucher: [
            { name: "tokenId", type: "uint256" },
            { name: "price", type: "uint256" },
            { name: "quantity", type: "uint256" },
            { name: "buyerQty", type: "uint256" },
            { name: "start", type: "uint256" },
            { name: "end", type: "uint256" },
            { name: "royalty", type: "uint96" },
            { name: "isStealth", type: "bool" },
            { name: "isSbt", type: "bool" },
          ],
        },
      },
      values: {
        nft: {
          price: 1,
          start: 0,
          end: 1555555555555555555555555555555555555555555,
          royality: 10,
          isStealth: false,
          isSbt: false,
        },
        mnft: {
          quantity: 2,
          buyerQty: 2,
          price: 1,
          start: 0,
          end: 1555555555555555555555555555555555555555555,
          royality: 10,
          isStealth: false,
          isSbt: false,
        },
      },
    },
  },
  errors: {
    acBadConf: "AccessControlBadConfirmation",
    accessDenied: "AccessDenied",
    acUnauthorized: "AccessControlUnauthorizedAccount",
    itemNotListed: "itemNotListed",
    invalidBuyer: "invalidBuyer",
    invalidPrice: "invalidPrice",
    invalidQuantity: "invalidQuantity",
    invalidTimePeriod: "invalidTimePeriod",
    approvalFailed: "approvalFailed",
    payMentNotConfirmed: "payMentNotConfirmed",
    invalidAmount: "invalidAmount",
    maliciousSignature: "maliciousSignature",
  },
  events: {
    roleRevoked: "RoleRevoked",
    roleGranted: "RoleGranted",
    approval: "Approval",
    transfer: "Transfer",
    txn: "Txn",
    stake: "Stake",
    claim: "Claim",
    bridged: "Bridged",
    purchase: "purchase",
    purchaseSucessfull: "purchaseSucessfull",
    refunded: "refunded",
  },
});
