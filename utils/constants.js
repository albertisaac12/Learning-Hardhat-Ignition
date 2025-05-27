module.exports = Object.freeze({
  author: "dappunk",
  title: "dappunk - Test Suite",
  description: "Various Web3 test for dappunk",
  priceMultiplier: 1000000000000000000,
  feeDenominator: 10000,
  royaltyMultiplier: 100,
  baseUri: "NoUrl",
  suffix: ".json",
  chainId: 31337,
  tokenAddress: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
  tokenAddress2: "0x9f188F410CC1E77B44681A3f51e24D6CF59B1676",
  zero: "0x0000000000000000000000000000000000000000000000000000000000000000",
  errors: {
    acBadConf: "AccessControlBadConfirmation",
    accessDenied: "AccessDenied",
    acUnauthorized: "AccessControlUnauthorizedAccount",
    alreadyAdded: "AlreadyAdded",
    deprecated: "Deprecated",
    erc20InsufficientAllowance: "ERC20InsufficientAllowance",
    eRC20InsufficientBalance: "ERC20InsufficientBalance",
    erc721InvalidSender: "ERC721InvalidSender",
    erc721NonexistentToken: "ERC721NonexistentToken",
    ERC721InvalidOwner: "ERC721InvalidOwner",
    ERC721NonexistentToken: "ERC721NonexistentToken",
    ERC721IncorrectOwner: "ERC721IncorrectOwner",
    ERC721InvalidSender: "ERC721InvalidSender",
    ERC721InvalidReceiver: "ERC721InvalidReceiver",
    ERC721InsufficientApproval: "ERC721InsufficientApproval",
    ERC721InvalidApprover: "ERC721InvalidApprover",
    ERC721InvalidOperator: "ERC721InvalidOperator",
    ERC1155InsufficientBalance: "ERC1155InsufficientBalance",
    ERC1155InvalidSender: "ERC1155InvalidSender",
    ERC1155InvalidReceiver: "ERC1155InvalidReceiver",
    ERC1155MissingApprovalForAll: "ERC1155MissingApprovalForAll",
    ERC1155InvalidApprover: "ERC1155InvalidApprover",
    ERC1155InvalidOperator: "ERC1155InvalidOperator",
    ERC1155InvalidArrayLength: "ERC1155InvalidArrayLength",
    insufficientBalance: "InsufficientBalance()",
    itemReserved: "ItemReserved",
    invalidPrice: "InvalidPrice",
    invalidSender: "InvalidSender",
    invalidToken: "InvalidToken",
    invalidTokenQty: "InvalidTokenQty",
    invalidVoucher: "InvalidVoucher",
    nonTransferableToken: "NonTransferableToken",
    notApproved: "NotApproved",
    notTokenOwner: "NotTokenOwner",
    notTokenCreator: "NotTokenCreator",
    notSupported: "NotSupported",
    saleEnded: "SaleEnded",
    saleNotStarted: "SaleNotStarted",
    tokenSaleNotStarted: "TokenSaleNotStarted", //(uint256 tokenId, uint256 start, uint256 now)
    tokenSaleEnded: "TokenSaleEnded", //(uint256 tokenId, uint256 end, uint256 now);
  },
  events: {
    locked: "Locked",
    burnt: "Burnt",
    transfer: "Transfer",
    transferSingle: "TransferSingle",
    transferBatch: "TransferBatch",
  },
  contracts: {
    mint721: {
      file: "contracts/minting/dappunk721.sol:dappunkCreations721",
      name: "dpNftV1",
      symbol: "DPN1",
      defaultValues: {
        stealthUrl: "StealthUrl",
        platformFee: 1000,
        pioneerFee: 500,
      },
      domain: {
        domain: "staging721",
        version: "1",
      },
      functions: {
        mintNative:
          "mintNft((uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes))",
        mintApi:
          "mintNft((uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        mintToken:
          "mintNftWithToken((uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        addSupportedToken: "addSupportedToken(address)",
      },
    },
    mint1155: {
      file: "contracts/minting/dappunk1155.sol:dappunkCreations1155",
      name: "dpNftV1",
      symbol: "DPN1",
      defaultValues: {
        stealthUrl: "StealthUrl",
        platformFee: 1000,
        pioneerFee: 500,
      },
      domain: {
        domain: "moshpit1155",
        version: "1",
      },
      functions: {
        mintNative:
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes))",
        mintApi:
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        mintToken:
          "mintNftWithToken((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        addSupportedToken: "addSupportedToken(address)",
      },
    },
    dappunkCreations: {
      file: "contracts/minting/dpc.sol:dappunkCreations", // change this
      name: "dpNftV1",
      symbol: "DPN1",
      defaultValues: {
        stealthUrl: "StealthUrl",
        platformFee: 1000,
        pioneerFee: 500,
      },
      domain: {
        domain: "moshpit",
        version: "1",
      },
      functions: {
        mintNative:
          "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        mintApi:
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        mintToken:
          "mintNftWithToken((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address,address)",
        mintNftGasless:
          "mintNftGasless((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)",
        addSupportedToken: "addSupportedToken(address)",
        verifyVoucher:
          "verifyVoucher((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes))",
        withdraw: "withdraw()",
      },
    },
    marketplace: {
      file: "contracts/marketplace/dappunkMarketplaceV1.sol:dappunkMarketplace",
      name: "dpMarketplaceV1",
      symbol: "DPM1",
      newContract: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
      domain: {
        domain: "dappunkMarketplace",
        version: "1",
      },
      currency: {
        token: 0,
        native: 1,
      },
      defaultValues: {
        platformFee: 10000,
        deprecated: false,
      },
      functions: {
        listItem:
          "listItem(address,uint256,address,uint256,uint256,uint256,uint256)",
        listItemReserved:
          "listItem(address,uint256,address,uint256,uint256,uint256,uint256,address)",
        updateListedItem:
          "updateListedItem(address,uint256,address,uint256,uint256,uint256,uint256)",
        updateListedItemReserved:
          "updateListedItem(address,uint256,address,uint256,uint256,uint256,uint256,address)",
        buyItem: "buyItem(address,uint256,address)",
        buyItemApi:
          "buyItem((address,uint256,uint256,uint256,address,address,bytes,bytes,bytes))",
      },
      events: {
        ListItem: "ListItem",
        ListReservedItem: "ListReservedItem",
        UpdateListItem: "UpdateListItem",
        UpdateReservedListItem: "UpdateReservedListItem",
        ItemSold: "ItemSold",
      },
    },
    gift: {
      file: "contracts/gift/dappunkGifts.sol:dappunkGiftingV1",
      // file: "contracts/gift/dappunkGifts-flatten.sol:dappunkGiftingV1",
      // flat: "contracts/gift/dappunkGifts-flatten.sol:dappunkGiftingV1",
      name: "dpGiftV1",
      symbol: "DPG1",
      domain: {
        domain: "dappunkGift",
        version: "1",
      },
      defaultValues: {
        senderFee: 500,
        receiverFee: 500,
      },
      functions: {
        giftApi:
          "gift((uint256,uint256,uint96,uint96,bool,address,bytes,bytes),address,address)",
        giftNative:
          "gift((uint256,uint256,uint96,uint96,bool,address,bytes,bytes))",
        giftToken:
          "gift((uint256,uint256,uint96,uint96,bool,address,bytes,bytes),address)",
        addSupportedToken: "addSupportedToken(address)",
        refundNft: "refundNFT(uint256,address,address)",
        burn: "burn(uint256)",
        approve: "approve(address,uint256)",
        setApprovalForAll: "setApprovalForAll(address,bool)",
        withdrawPlatformFund: "withdrawPlatformFund(uint256)",
        withdrawTokenFund: "withdrawTokenFund(uint256,address)",
      },
    },
    invite: {
      file: "contracts/special/Invite.sol:dappunkInvites",
      name: "dpInvitesV1",
      symbol: "DPI1",
      domain: {
        domain: "dappunkInvite",
        version: "1",
      },
    },
    rewards: {
      file: "contracts/special/Rewards.sol:dappunkRewards",
      name: "dpRewardsV1",
      symbol: "DPR1",
      domain: {
        domain: "dappunkReward",
        version: "1",
      },
    },
    collectables: {
      file: "contracts/collectables/collectables-qty-update.sol:dappunkCollectables",
      functions: {
        setURI: "setURI(string)",
        mint: "mint(address,uint256,uint256)",
        mintBatch: "mintBatch(address,uint256[],uint256[])",
        safeTransferFrom:
          "safeTransferFrom(address,address,uint256,uint256,bytes)",
        safeBatchTransferFrom:
          "safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)",
        airdrop: "airdrop(address[],uint256,uint256)",
        pause: "pause()",
        unpause: "unpause()",
        supportsInterface: "supportsInterface(bytes4)",
        mintBatchMatchingTokenId:
          "mintBatchMatchingTokenId(address[],uint256,uint256[])",
      },
      errors: {
        maxQuantityExceeded: "maxQuantityExceeded",
        isDeprecated: "isDeprecated",
        collectableLocked: "collectableLocked",
        invalidClaim: "invalidClaim",
        alreadyClaimed: "alreadyClaimed",
        maxQuantityPerAddressMinted: "maxQuantityPerAddressMinted",
      },
      events: {
        airdropped: "airdropped()",
      },
    },
    test: {
      files: {
        dpToken: "contracts/TestToken.sol:dappunkToken",
        usdt: "contracts/TestUsdt.sol:UsdtToken",
        erc721: "contracts/ERC721TokenCreation.sol:ERC721Collection",
        erc1155: "contracts/ERC1155TokenCreation.sol:ERC1155Collection",
      },
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
    Gift: {
      GiftVoucher: [
        { name: "tokenId", type: "uint256" },
        { name: "value", type: "uint256" },
        { name: "giftType", type: "uint96" },
        { name: "variant", type: "uint96" },
        { name: "feesCovered", type: "bool" },
        { name: "receiver", type: "address" },
      ],
    },
  },
  functions: {
    addSupportedToken: "addSupportedToken(address)",
    withdraw: "withdraw()",
    withdrawToken: "withdraw(address)",
  },
  roles: {
    DEFAULT_ADMIN_ROLE:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    MANAGER_ROLE:
      "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08",
    MINTER_ROLE:
      "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
    FUND_MANAGER_ROLE:
      "0x0b84ee281e5cf521a9ad54a86fafe78946b157177e231bd8ae785af4d3b3620f",
    AGENCY_MANAGER_ROLE:
      "0xcb537bb7c1dd9a99e1e9e3218a83a4936df1aa47343691ec1fc189b54846b8db",
    ROYALTY_MANAGER_ROLE:
      "0x4c845bd8367732455594e4267d2660f9c3f2cbb53288e8c2f3ec69276e9a440a",
    CONTRACT_APPROVER_ROLE:
      "0x9d0cb6388940ec44aff12d70fd4376552d3388d1289e4f721717b04915c21f0f",
    MINT_VALIDATOR_ROLE:
      "0x0630017baf756fcad9ef6419e950e9050c669e937123dae066db5d79403bc0b8",
    REFUND_MANAGER_ROLE:
      "0xc89f08b49c068684bf15b77e68611a9f601e70d1f919059510bccd18e691e535",
    VALIDATOR_ROLE:
      "0x21702c8af46127c7fa207f89d0b0a8441bb32959a0ac7df790e9ab1a25c98926",
    INVITER_ROLE:
      "0x639cc15674e3ab889ef8ffacb1499d6c868345f7a98e2158a7d43d23a757f8e0",
    REWARDER_ROLE:
      "0xbeec13769b5f410b0584f69811bfd923818456d5edcf426b0e31cf90eed7a3f6",
    RELAYER_ROLE:
      "0xe2b7fb3b832174769106daebcfd6d1970523240dda11281102db9363b83b0dc4",
    URI_SETTER_ROLE:
      "0x7804d923f43a17d325d77e781528e0793b2edd9890ab45fc64efd7b4b427744c",
    MARKET_PLACE:
      "0x4201506c6a71f83bd7604006d37c474435301b63f52fc58ab660a4853a23237a",
  },
  interfaceId: {
    ERC165: "0x01ffc9a7",
    ERC20: "0x36372b07",
    ERC721: "0x80ac58cd",
    ERC1155: "0xd9b67a26",
    ERC5192: "0xb45a3c0e",
    ERC2981: "0x2a55205a",
    AccessControl: "0x7965db0b",
  },
});
