const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const {
  generateTokenId,
  getSignedVoucher,
  getMsgValue,
} = require("../../utils/utils");
const { voucherGeneration } = require("../../utils/sig2");

const {
  roles,
  platformFees,
  contracts,
  errors,
} = require("../../utils/marketPlaceConstants");

describe("Signature Verification Test", () => {
  let owner, signer1, signer2, signer3;
  let contractNFT, contract1155, contractMp, contractPunk;
  let mnft, mp, token;
  let nftAddress, mnftAddress, mpAddress, tokenAddress;
  let ownerAddress, signer1Address, signer2Address, signer3Address;
  let logicFactory, logicContract, logicAddress;
  let func = contracts.metaMarketPlace.functions;
  let tokenId;
  let tokenIDnum;
  beforeEach(async function () {
    [owner, signer1, signer2, signer3] = await ethers.getSigners();
    ownerAddress = owner.address;
    signer1Address = signer1.address;
    signer2Address = signer2.address;
    signer3Address = signer3.address;

    // console.log("This is the owner Address: ", ownerAddress);
    // console.log("This is the signer Address: ", signer1Address);

    contract1155 = await ethers.getContractFactory("dappunkCreations");
    contractPunk = await ethers.getContractFactory("punkToken11");
    contractMp = await ethers.getContractFactory("metaMarketPlace");

    logicFactory = await ethers.getContractFactory(
      "contracts/Logic/forewarder.sol:logic"
    );
    logicContract = await logicFactory.connect(owner).deploy("meow");
    await logicContract.waitForDeployment();
    logicAddress = await logicContract.getAddress();

    mnft = await contract1155.deploy(
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      [ownerAddress],
      logicAddress
    );
    mnftAddress = await mnft.getAddress();

    token = await upgrades.deployProxy(contractPunk, [ownerAddress], {
      kind: "uups",
    });
    await token.waitForDeployment();

    tokenAddress = await token.getAddress();

    mp = await contractMp.deploy(
      mnftAddress,
      tokenAddress,
      platformFees,
      logicAddress
    );

    mpAddress = await mp.getAddress();

    await mnft[func.grantRole](roles.MARKET_PLACE, mpAddress);
    await token[func.grantRole](roles.MARKET_PLACE, mpAddress);

    tokenId = generateTokenId(signer1.address, 1, 1, 15);
    // console.log(tokenId);
    tokenIDnum = ethers.toBigInt(tokenId);
    // console.log(tokenIDnum);
    const details = {
      price: 200,
      royalty: 100,
      start: 0,
      end: ethers.toBigInt(
        "1555555555555555555555555555555555555555555555555555"
      ),
      stealth: false,
      sbt: false,
      tokenAdr: null,
      quantity: 15,
      buyerQty: 1,
    };

    const value = getMsgValue(details.price, false, false, 1);
    // price = values.price;
    // quantity = values.quantity;
    //   buyerQty = values.buyerQty;
    //   tokenId = values.tokenId;
    //   start = values.start;
    //   end = values.end;
    //   royalty = values.royalty * royaltyMultiplier;
    //   isStealth = values.isStealth;
    //   isSbt = values.isSbt;

    const values = {
      tokenId: tokenId,
      price: value,
      quantity: details.quantity,
      buyerQty: details.buyerQty,
      start: details.start,
      end: details.end,
      royalty: details.royalty,
      isStealth: details.stealth,
      isSbt: details.sbt,
    };

    const voucher = await getSignedVoucher(
      mnft,
      "dpCreations",
      values,
      signer1,
      owner
    );
    // console.log(voucher);
    await mnft.grantRole(roles.DEFAULT_ADMIN_ROLE, signer1Address);
    const tx = await mnft
      .connect(signer1)
      [
        "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
      ](voucher, signer1Address, { value: voucher.price });
    expect(tx).to.not.be.reverted;
  });

  describe("2 Verify Signature Test", () => {
    it("2.1 Should Revert if the Voucher is not listed", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        false
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.itemNotListed);
    });
    it("2.2 Should Revert if purchaseVoucher validity is less than the current block.timestamp", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: 0, // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidTimePeriod);
    });
    it("2.3 Should Revert if the marketPlaceVoucher end time is less than the marketPlaceVoucher start time", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: 0, // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidTimePeriod);
    });
    it("2.4 Should Revert if the marketPlaceVoucher end time is less than the current block.timestamp", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: 2, // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidTimePeriod);
    });
    it("2.5 Should Revert if the marketPlaceVoucher start time is greater than the current block.timestamp", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: ethers.toBigInt("1000000000000000000000"), // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidTimePeriod);
    });
    it("2.6 Should Revert if the marketPlaceVoucher quantity is equal to zero", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 0,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidQuantity);
    });
    it("2.7 Should Revert if the marketPlaceVoucher signature is altered", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      voucher.ownerSiganture = purchaseVoucher.buyerSignature;
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.maliciousSignature);
    });
    it("2.8 Should Revert if the Purchase Voucher quantity is zero", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 0,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidQuantity);
    });
    it("2.9 Should Revert if the Purchase Voucher price is zero", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: 0, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 0,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mnft,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      voucher.ownerSiganture = purchaseVoucher.buyerSignature;
      await expect(
        mp[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidPrice);
    });
    // it("Additional test should revert if the mnft is not minted to the signer1", async () => {
    //   expect(await mnft.ownerOf(ethers.toBigInt(tokenId))).to.equal(
    //     signer1.address
    //   );
    // });
    it("2.10 Should Revert if the purchaseVocher buyerAddress is not equal to the actual buyer", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: 10, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: signer1Address,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp.connect(owner)[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, "invalidBuyer()");
    });
    it("2.11 Should return the tokenId if the verify Siganture works fine", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId),
        quantity: 1,
        price: 10, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      const tx = await mp
        .connect(owner)
        [func.verifySignature](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      // expect(tx).to.equal(ethers.toBigInt(tokenId));
    });
    it("2.12 Should revert if the retrived Quantity is less than the Market Place Voucher Quantity", async () => {
      const tokenID2 = generateTokenId(signer1.address, 1, 1, 2);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenID2),
        quantity: 3,
        price: 10, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenID2),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp.connect(owner)[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidQuantity);
    });
    it("2.13 Should revert if the retrived Quantity is less than the Purchase Voucher Quantity", async () => {
      const tokenID2 = generateTokenId(signer1.address, 1, 1, 1);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenID2),
        quantity: 1,
        price: 10, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenID2),
        quantity: 3,
        validUntil: ethers.toBigInt("1000000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp.connect(owner)[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidQuantity);
    });
    it("2.14 Should revert if the Purchase Voucher Quantity is greater than the Market Place Voucher Quantity", async () => {
      const tokenID2 = generateTokenId(signer1.address, 1, 1, 2);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenID2),
        quantity: 2,
        price: 10, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("2000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenID2),
        quantity: 3,
        validUntil: ethers.toBigInt("1000000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnfees: 0,
        purchaseingIn: 2,
      };
      let { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp.connect(owner)[func.verifySignature](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidQuantity);
    });
  });
});
