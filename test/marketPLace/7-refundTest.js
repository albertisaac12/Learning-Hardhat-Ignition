const { BigNumber } = require("bignumber.js");
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
  events,
} = require("../../utils/marketPlaceConstants");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("7 Refund Test", () => {
  let owner, signer1, signer2, signer3;
  let contractNFT, contract1155, contractMp, contractPunk;
  let nft, mnft, mp, token;
  let nftAddress, mnftAddress, mpAddress, tokenAddress;
  let ownerAddress, signer1Address, signer2Address, signer3Address;
  let func = contracts.metaMarketPlace.functions;
  let tokenId, tokenId2;
  let tokenIDnum, tokenIDnum2;
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
      "contracts/Forwarder/forewarder.sol:logic"
    );
    logicContract = await logicFactory.connect(owner).deploy("meow");
    await logicContract.waitForDeployment();
    logicAddress = await logicContract.getAddress();

    // await owner.sendTransaction({
    //   value: ethers.parseEther("1"),
    //   to: mnftAddress,
    // });

    mnft = await contract1155.deploy(
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      logicAddress
    );
    mnftAddress = await mnft.getAddress();
    // console.log(mnftAddress);

    token = await upgrades.deployProxy(contractPunk, [ownerAddress], {
      kind: "uups",
    });
    await token.waitForDeployment();

    tokenAddress = await token.getAddress();
    // console.log(tokenAddress);
    mp = await contractMp.deploy(
      mnftAddress,
      ethers.parseEther("11"),
      ownerAddress,
      ownerAddress,
      ownerAddress,
      logicAddress
    );

    mpAddress = await mp.getAddress();
    // await owner.sendTransaction({
    //   value: ethers.parseEther("1"),
    //   to: mpAddress,
    // });
    await mp.connect(owner).setTokenAddress(tokenAddress);

    await mnft[func.grantRole](roles.MARKET_PLACE, mpAddress);
    await mnft[func.grantRole](roles.DEFAULT_ADMIN_ROLE, signer1Address);
    await token[func.grantRole](roles.MARKET_PLACE, mpAddress);

    await token.connect(owner).mint(ownerAddress, ethers.parseEther("100"));
    await token.connect(owner).mint(signer1Address, ethers.parseEther("100"));
    await token.connect(owner).mint(signer2Address, ethers.parseEther("100"));
    await token.connect(owner).mint(signer3Address, ethers.parseEther("100"));

    tokenId2 = generateTokenId(signer1.address, 1, 1);
    tokenIDnum2 = ethers.toBigInt(tokenId2);

    const details2 = {
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
      buyerQty: 2,
    };

    const value2 = getMsgValue(details2.price, false, false, details2.buyerQty);
    // console.log(value2);

    const values2 = {
      tokenId: tokenIDnum2,
      price: ethers.toBigInt("200"),
      quantity: details2.quantity,
      buyerQty: details2.buyerQty,
      start: details2.start,
      end: details2.end,
      royalty: details2.royalty,
      isStealth: details2.stealth,
      isSbt: details2.sbt,
    };

    const voucher1 = await getSignedVoucher(
      mnft,
      "dpCreations",
      values2,
      signer1,
      owner
    );
    // console.log(voucher1);
    // heareeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee checkkkkkkkk

    const bx = await mnft
      .connect(signer1)
      [
        "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
      ](voucher1, signer1Address, {
        value: ethers.toBigInt("400"),
      });
    expect(bx).to.not.be.reverted;
    // console.log(await mnft.balanceOf(signer1Address, tokenIDnum2));
    expect(await mnft.balanceOf(signer1Address, tokenIDnum2)).to.equal(2);
  });
  it("ddd", async () => {
    expect(1).to.equal(1);
  });
  describe("7.1 Refund function test", async () => {
    it("7.1.1 Should be able to refund NFT", async () => {
      await mnft.safeTransferFrom(
        signer1Address,
        signer2Address,
        tokenIDnum2,
        1,
        "0x00"
      );
      const detailsMp = {
        listingAddress: signer2Address,
        tokenId: ethers.toBigInt(tokenId2),
        quantity: 1,
        price: 100, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: signer3Address,
        purchaseId: ethers.toBigInt(tokenId2),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        signer3,
        signer2,
        true
      );

      const tx = await mp
        .connect(owner)
        [func.purchaseUSD](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(signer3Address, tokenIDnum2)).to.equal(1);

      const refundVoucher = {};
      refundVoucher.buyer = signer3Address;
      refundVoucher.seller = signer2Address;
      refundVoucher.tokenId = tokenIDnum2;
      refundVoucher.price = voucher.price;
      refundVoucher.quantity = 1;
      await mp.connect(owner)[func.refund](refundVoucher);
      expect(await mnft.balanceOf(signer2Address, tokenIDnum2)).to.equal(1);
    });
    it("7.1.2 Only the REFUND_MANAGER can refund the tokens", async () => {
      await mnft.safeTransferFrom(
        signer1Address,
        signer2Address,
        tokenIDnum2,
        1,
        "0x00"
      );
      const detailsMp = {
        listingAddress: signer2Address,
        tokenId: ethers.toBigInt(tokenId2),
        quantity: 1,
        price: 100, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId2),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("100"), // cost
        txnFees: 0,
        purchasingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer2,
        true
      );

      const tx = await mp
        .connect(owner)
        [func.purchaseUSD](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);

      const refundVoucher = {};
      refundVoucher.buyer = ownerAddress;
      refundVoucher.seller = signer2Address;
      refundVoucher.tokenId = tokenIDnum2;
      refundVoucher.price = voucher.price;
      refundVoucher.quantity = 1;
      await expect(mp.connect(signer1)[func.refund](refundVoucher))
        .to.be.revertedWithCustomError(mp, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });
    it("7.1.3 Should emit event after a succesfull refund", async () => {
      await mnft.safeTransferFrom(
        signer1Address,
        signer2Address,
        tokenIDnum2,
        1,
        "0x00"
      );
      const detailsMp = {
        listingAddress: signer2Address,
        tokenId: ethers.toBigInt(tokenId2),
        quantity: 1,
        price: 100, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: signer3Address,
        purchaseId: ethers.toBigInt(tokenId2),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        signer3,
        signer2,
        true
      );

      const tx = await mp
        .connect(owner)
        [func.purchaseUSD](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(signer3Address, tokenIDnum2)).to.equal(1);

      const refundVoucher = {};
      refundVoucher.buyer = signer3Address;
      refundVoucher.seller = signer2Address;
      refundVoucher.tokenId = tokenIDnum2;
      refundVoucher.price = voucher.price;
      refundVoucher.quantity = 1;
      expect(await mp.connect(owner)[func.refund](refundVoucher))
        .to.emit(mp, events.refunded)
        .withArgs(signer3Address, signer2Address, tokenIDnum2, voucher.price);
    });
  });
});
