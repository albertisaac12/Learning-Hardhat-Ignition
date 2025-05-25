const constants = require("./constants");

/**
 * Generate the token ID for NFT.
 *
 * Supports ERC721 and ERC1155 only.
 *
 *
 * @param {Object}   creator          Wallet creating the NFT.
 * @param {number}   collectionIndex  Collection Index.
 * @param {number}   tokenIndex       Token Index.

 *
 * @return {string} TokenId as BigInt string.
 */
function generateTokenId(creator, collectionIndex, tokenIndex) {
  // let tokenQtyHex = "";
  let collectionNumSize = 10; // number of Hex Characters
  const tokenIdNumSize = 14; // number of Hex Characters

  // const qtyNumSize = 4;
  // let totalBytes = 20 + collectionNumSize / 2 + tokenIdNumSize / 2;
  // tokenQtyHex = padValue(parseInt(tokenQty).toString(16), qtyNumSize);

  // console.log("Total Bytes: ", totalBytes);

  let collectionIdHex = padValue(
    parseInt(collectionIndex).toString(16),
    collectionNumSize
  );
  // console.log("collectionIdHex: ", collectionIdHex);

  let tokenIdHexTemp = padValue(
    parseInt(tokenIndex).toString(16),
    tokenIdNumSize
  );
  // console.log("tokenIdHexTemp: ", tokenIdHexTemp);

  let finalToken = creator.toString(16) + collectionIdHex + tokenIdHexTemp;

  // finalToken = finalToken + tokenQtyHex;

  let finalTokenNum = BigInt(finalToken).toString();
  // console.log("Final Token Num: ", finalTokenNum);

  return finalTokenNum;
}

function generateGiftId(creator, tokenIndex) {
  let collectionNumSize = 14;
  const tokenIdNumSize = 10;

  let collectionIdHex = padValue(parseInt(0).toString(16), collectionNumSize);

  let tokenIdHexTemp = padValue(
    parseInt(tokenIndex).toString(16),
    tokenIdNumSize
  );

  let finalToken = creator.toString(16) + collectionIdHex + tokenIdHexTemp;

  let finalTokenNum = BigInt(finalToken).toString();

  return finalTokenNum;
}

function padValue(input, length) {
  let pad = length - input.length;
  if (pad >= 0) {
    let padding = new Array(pad + 1).join("0");
    let result = padding + input;
    return result;
  }
}

/**
 * Created the voucher for an NFT in any of dappunk's contract.
 *
 * Supports ERC721, ERC1155 and Gifting.
 *
 *
 * @param {('721'|'1155'|'gift')}   contractType   Type of contract.
 * @param {Object}   contract   Minting Contract.
 * @param {Object}   values     values object depending on type.
 * @param {Object}   cAdr       Creator or Sender or NFT.
 * @param {Object}   vAdr       Validator Wallet.
 *
 * @return {Object} Returns if mint was successful.
 */
const getSignedVoucher = async (contract, contractType, values, cAdr, vAdr) => {
  let contractConst, types, voucher;
  const contractAdr = await contract.getAddress();
  const royaltyMultiplier = constants.royaltyMultiplier;

  let price, tokenId;
  let royalty, isStealth, isSbt, start, end;
  let quantity, buyerQty;

  // let giftType, giftVariant, feesCovered, receiver;

  // contractConst = constants.contracts.mint1155;
  types = {
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
  };
  tokenId = values.tokenId;
  price = values.price;
  quantity = values.quantity;
  buyerQty = values.buyerQty;
  start = values.start;
  end = values.end;
  royalty = values.royalty * royaltyMultiplier;
  isStealth = values.isStealth;
  isSbt = values.isSbt;

  voucher = {
    tokenId,
    price,
    quantity,
    buyerQty,
    start,
    end,
    royalty,
    isStealth,
    isSbt,
  };

  // Uses the ContractConst to determine the domain
  const domain = {
    name: constants.contracts.dappunkCreations.domain.domain,
    version: constants.contracts.dappunkCreations.domain.version,
    verifyingContract: contractAdr,
    chainId: constants.chainId,
  };
  // console.log("domain: ", domain);

  // Created the required signatures
  const creator = await cAdr.signTypedData(domain, types, voucher);
  const validator = await vAdr.signTypedData(domain, types, voucher);

  // Finalises the voucher
  contractType == "gift"
    ? (voucher = { ...voucher, sender: creator, validator })
    : (voucher = { ...voucher, creator, validator });

  return voucher;
};

/**
 * The amount to be paid for a mint function.
 *
 * @param {string}  price    BigInt price of token.
 * @param {bool}    isGift   Identifies if this is a item for gifting or not.
 * @param {bool}    [isCovered=false]   Optional param to identify if gift ReceiverFee is covered.
 * @param {number}  [qty=1]  Optional Qty param, default is 1.
 *
 * @return {string} msgValue as BigInt string.
 */
const getMsgValue = (price, isGift, isCovered, qty) => {
  isCovered = isCovered != null ? isCovered : false;
  qty = qty != null ? qty : 1;

  const priceMultiplier = constants.priceMultiplier;
  const feeDenominator = constants.feeDenominator;

  let value = price * qty;

  // Handling Gift
  if (isGift) {
    const senderFee = constants.contracts.gift.defaultValues.senderFee;
    const receiverFee = constants.contracts.gift.defaultValues.senderFee;

    // Calculating fee
    const fee = isCovered
      ? (price * (senderFee + receiverFee)) / feeDenominator
      : (price * senderFee) / feeDenominator;

    value = price + fee;
  }

  return BigInt(value * priceMultiplier).toString();
};

/**
 * The fee for an NFT mint.
 *
 * @param {string}  price    BigInt price of token.
 * @param {bool}    [isPioneer=false]   Optional param to identify if creator is pioneer.
 * @param {bool}    [qty=1]   Optional param to identify if creator is pioneer.
 *
 * @return {string} fee as BigInt.
 */
const getFee = (price, isPioneer, qty) => {
  isPioneer = isPioneer != null ? isPioneer : false;
  qty = qty != null ? qty : 1;

  const priceMultiplier = constants.priceMultiplier;
  const feeDenominator = constants.feeDenominator;
  const theFee = !isPioneer
    ? constants.contracts.mint721.defaultValues.platformFee
    : constants.contracts.mint721.defaultValues.pioneerFee;

  return BigInt((price * qty * theFee * priceMultiplier) / feeDenominator);
};

/**
 * The fee for an NFT mint.
 *
 * @param {string}  price    BigInt price of token.
 * @param {number}  fee      Fee that an agency gets.
 *
 * @return {string} fee as BigInt.
 */
const getAgencyFee = (price, fee) => {
  const priceMultiplier = constants.priceMultiplier;
  const feeDenominator = constants.feeDenominator;

  return BigInt((price * fee * priceMultiplier) / feeDenominator);
};

const getNow = () => {
  return parseInt((Date.now() / 1000).toString());
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

exports.generateTokenId = generateTokenId;
exports.generateGiftId = generateGiftId;
exports.padValue = padValue;
exports.getNow = getNow;
exports.delay = delay;
exports.getSignedVoucher = getSignedVoucher;
exports.getMsgValue = getMsgValue;
exports.getFee = getFee;
exports.getAgencyFee = getAgencyFee;
