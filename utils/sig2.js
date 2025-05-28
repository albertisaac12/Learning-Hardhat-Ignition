const { ethers } = require("hardhat");

async function generateDigest(voucher, contract) {
  const domain = {
    name: "dappunkMarketPlace",
    version: "1",
    chainId: 31337,
    verifyingContract: await contract.getAddress(),
  };

  const types = {
    marketPlaceVoucher: [
      { name: "listingAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "listedIn", type: "uint256" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "isListed", type: "bool" },
    ],
  };

  // Instantiate AbiCoder
  const abiCoder = new ethers.AbiCoder();

  // Encode the data
  const encodedData = abiCoder.encode(
    [
      "bytes32",
      "address",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "bool",
    ],
    [
      ethers.id(
        "marketPlaceVoucher(address listingAddress,uint256 tokenId,uint256 quantity,uint256 price,uint256 listedIn,uint256 start,uint256 end,bool isListed)"
      ),
      voucher.listingAddress,
      voucher.tokenId,
      voucher.quantity,
      voucher.price,
      voucher.listedIn,
      voucher.start,
      voucher.end,
      voucher.isListed,
    ]
  );

  // Hash the encoded data
  const dataHash = ethers.keccak256(encodedData);

  // Compute the digest
  const digest = ethers.TypedDataEncoder.hash(domain, types, voucher);

  // console.log("Digest:", digest);

  return digest;
}

async function generatePurchaseDigest(purchaseVoucher, contract) {
  const domain = {
    name: "dappunkMarketPlace",
    version: "1",
    chainId: 31337,
    verifyingContract: await contract.getAddress(),
  };

  const types = {
    purchaseVoucher: [
      { name: "buyerAddress", type: "address" },
      { name: "purchaseId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "validUntil", type: "uint256" },
      { name: "USDprice", type: "uint256" },
      { name: "txnFees", type: "uint256" },
      { name: "purchasingIn", type: "uint256" },
    ],
  };

  // Instantiate AbiCoder
  const abiCoder = new ethers.AbiCoder();

  // Encode the data
  const encodedData = abiCoder.encode(
    [
      "bytes32",
      "address",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
      "uint256",
    ],
    [
      ethers.id(
        "purchaseVoucher(address buyerAddress,uint256 purchaseId,uint256 quantity,uint256 validUntil,uint256 USDprice,uint256 txnFees,uint256 purchasingIn)"
      ),
      purchaseVoucher.buyerAddress,
      purchaseVoucher.purchaseId,
      purchaseVoucher.quantity,
      purchaseVoucher.validUntil,
      purchaseVoucher.USDprice,
      purchaseVoucher.txnFees,
      purchaseVoucher.purchasingIn,
    ]
  );

  // Hash the encoded data
  const dataHash = ethers.keccak256(encodedData);

  // Compute the digest
  const digest = ethers.TypedDataEncoder.hash(domain, types, purchaseVoucher);

  // console.log("Purchase Digest:", digest);

  return digest;
}

async function voucherGeneration(
  contract,
  details1,
  details2,
  owner, // buyer
  signer1, // owner
  listing
) {
  const marketPlaceDomain = {
    name: "dappunkMarketPlace",
    version: "1",
    chainId: 31337,
    verifyingContract: await contract.getAddress(),
  };

  const types = {
    marketPlaceVoucher: [
      { name: "listingAddress", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "listedIn", type: "uint256" },
      { name: "start", type: "uint256" },
      { name: "end", type: "uint256" },
      { name: "isListed", type: "bool" },
    ],
    purchaseVoucher: [
      { name: "buyerAddress", type: "address" },
      { name: "purchaseId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "validUntil", type: "uint256" },
      { name: "USDprice", type: "uint256" },
      { name: "txnFees", type: "uint256" },
      { name: "purchasingIn", type: "uint256" },
    ],
  };

  const voucher = {
    listingAddress: details1.listingAddress,
    tokenId: details1.tokenId,
    quantity: details1.quantity,
    price: details1.price,
    listedIn: details1.listedIn,
    start: details1.start,
    end: details1.end,
    isListed: listing,
  };

  const purchaseVoucher = {
    buyerAddress: details2.buyerAddress,
    purchaseId: details2.purchaseId,
    quantity: details2.quantity,
    validUntil: details2.validUntil,
    USDprice: details2.USDprice, // price conv
    txnFees: details2.txnFees,
    purchasingIn: details2.purchasingIn, // 0 1 2
  };

  const ownerSignature = await signer1.signTypedData(
    marketPlaceDomain,
    { marketPlaceVoucher: types.marketPlaceVoucher },
    voucher
  );

  const digest = await generateDigest(voucher, contract);
  voucher.ownerSignature = ownerSignature;

  const buyerSignature = await owner.signTypedData(
    marketPlaceDomain,
    { purchaseVoucher: types.purchaseVoucher },
    purchaseVoucher
  );

  const purchaseDigest = await generatePurchaseDigest(
    purchaseVoucher,
    contract
  );
  purchaseVoucher.buyerSignature = buyerSignature;

  // console.log("Signed Voucher:", voucher);
  // console.log("Signed Purchase Voucher:", purchaseVoucher);

  const signer = ethers.recoverAddress(digest, ownerSignature);
  const buyerSigner = ethers.recoverAddress(purchaseDigest, buyerSignature);

  // console.log(signer === voucher.listingAddress);
  // console.log(buyerSigner === purchaseVoucher.buyerAddress);
  return { voucher, purchaseVoucher };
}

exports.voucherGeneration = voucherGeneration;
