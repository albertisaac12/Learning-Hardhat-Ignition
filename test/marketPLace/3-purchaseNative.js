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
  contracts,
  errors,
} = require("../../utils/marketPlaceConstants");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
// const { eth } = require("web3");

describe("3 Purchase Native Test", () => {
  let owner, signer1, signer2, signer3;
  let contract1155, contractMp, contractPunk;
  let mnft, mp, token;
  let mnftAddress, mpAddress, tokenAddress;
  let ownerAddress, signer1Address, signer2Address, signer3Address;
  let logicFactory, logicContract, logicAddress;
  let func = contracts.metaMarketPlace.functions;
  let tokenId2;
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
    // mp = await contractMp.deploy(
    //   mnftAddress,
    //   tokenAddress,
    //   ethers.parseEther("11"),
    //   logicAddress
    //   // ethers.toBigInt(platformFees)
    // );
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

    await mnft[func.grantRole](roles.MARKET_PLACE, mpAddress);
    await mnft[func.grantRole](roles.DEFAULT_ADMIN_ROLE, signer1Address);
    await token[func.grantRole](roles.MARKET_PLACE, mpAddress);

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
  describe("3.1 Testing for proper Vouchers", () => {
    it("3.1.1 Should Revert if Valid vouchers are not passed", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("0.01"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: signer1Address,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("0.01"), // cost
        txnFees: 0,
        purchasingIn: 2,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );

      await expect(
        mp
          .connect(owner)
          [
            "purchaseNative((address,uint256,uint256,uint256,uint256,uint256,uint256,bool,bytes),(address,uint256,uint256,uint256,uint256,uint256,uint256,bytes))"
          ](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, "invalidBuyer()");
    });
  });
  describe("3.2 Purchase Native Test for [USD NATIVE]", () => {
    it("3.2.1 Should Revert if correct amount is not sent", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: 100, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );

      await expect(
        mp.connect(owner)[func.purchaseNative](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, "invalidAmount()");
    });
    it("3.2.2 Should revert if MARKET_PLACE ROLE is not given to the marketplace contract in the 1155 contract", async () => {
      await mnft[func.revokeRole](roles.MARKET_PLACE, mpAddress);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      await expect(
        mp.connect(owner)[func.purchaseNative](voucher, purchaseVoucher, {
          value: ethers.parseEther("20"),
        })
      ).to.be.reverted;
    });
    it("3.2.3 Should transfer NFT from the listing address to the buyer Address if correct voucher and value are sent", async () => {
      expect(await mnft[func.hasRole](roles.MARKET_PLACE, mpAddress)).to.equal(
        true
      );
      // expect(await nft.ownerOf(tokenIDnum2)).to.equal(signer1Address);
      // expect(await nft.balanceOf(signer1Address)).to.equal(1);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );

      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    });
    it("3.2.4 Should Transfer the correct Fees to the smart Contract", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      // const tx = await mp.aap(ethers.toBigInt(tokenId), {
      //   value: ethers.parseEther("10"),
      // });
      expect(tx).to.not.be.reverted;
      const balance = await ethers.provider.getBalance(mpAddress);
      expect(balance).to.equal(ethers.parseEther("1"));
    });
    it("3.2.5 Should Recieve the correct Price and Royality", async () => {
      const balanceBefore = await ethers.provider.getBalance(signer1Address);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      const balanceAfter = await ethers.provider.getBalance(signer1Address);
      const after = new BigNumber(balanceAfter);
      const total = new BigNumber(balanceBefore);
      const before = total.plus(voucher.price).plus(ethers.parseEther("10"));
      expect(before.toFixed()).to.equal(after.toFixed());
    });
    it("3.2.6 Creator Should recieve the correct Royality", async () => {
      await mnft
        .connect(signer1)
        .safeTransferFrom(
          signer1Address,
          signer2Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer2Address, tokenIDnum2)).to.equal(1);
      const balanceBefore = await ethers.provider.getBalance(signer1Address);
      const detailsMp = {
        listingAddress: signer2Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer2,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      const balanceAfter = await ethers.provider.getBalance(signer1Address);
      const after = new BigNumber(balanceAfter);
      const before = new BigNumber(balanceBefore);
      const diff = after.minus(before);
      expect(diff.toFixed()).to.equal(ethers.parseEther("10"));
    });
    it("3.2.7 Should be able to list and buy tokens after nft is not owned by the creator anymore", async () => {
      await mnft
        .connect(signer1)
        .safeTransferFrom(
          signer1Address,
          signer2Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer2Address, tokenIDnum2)).to.equal(1);
      await mnft
        .connect(signer2)
        .safeTransferFrom(
          signer2Address,
          signer3Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer3Address, tokenIDnum2)).to.equal(1);
      const detailsMp = {
        listingAddress: signer3Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer3,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    });
    it("3.2.8 Should emit event after a successfully after purchasing", async () => {
      await mnft
        .connect(signer1)
        .safeTransferFrom(
          signer1Address,
          signer2Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer2Address, tokenIDnum2)).to.equal(1);
      await mnft
        .connect(signer2)
        .safeTransferFrom(
          signer2Address,
          signer3Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer3Address, tokenIDnum2)).to.equal(1);
      const detailsMp = {
        listingAddress: signer3Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer3,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      expect(
        await mp.connect(owner).purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        })
      )
        .to.emit(mp, "purchaseSucessfull")
        .withArgs(anyValue, anyValue, anyValue);
    });
  });
  describe("3.3 Purchase Native Test for [NATIVE NATIVE]", () => {
    it("3.3.1 Should Revert if correct amount is not sent", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      await expect(
        mp.connect(owner).purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("20"),
        })
      ).to.be.revertedWithCustomError(mp, "invalidAmount()");
    });
    it("3.3.2 Should transfer NFT from the listing address to the buyer Address if correct voucher and value are sent", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    });
    it("3.3.3 Should Transfer the correct Fees to the smart Contract", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      const balance = await ethers.provider.getBalance(mpAddress);
      expect(balance).to.equal(ethers.parseEther("1"));
    });
    it("3.3.4 Should Recieve the correct Price and Royality", async () => {
      const balanceBefore = await ethers.provider.getBalance(signer1Address);
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      const balanceAfter = await ethers.provider.getBalance(signer1Address);
      const after = new BigNumber(balanceAfter);
      const total = new BigNumber(balanceBefore);
      const before = total.plus(voucher.price).plus(ethers.parseEther("10"));
      expect(before.toFixed()).to.equal(after.toFixed());
    });
    it("3.3.5 Creator Should recieve the correct Royality", async () => {
      await mnft
        .connect(signer1)
        .safeTransferFrom(
          signer1Address,
          signer2Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer2Address, tokenIDnum2)).to.equal(1);
      const balanceBefore = await ethers.provider.getBalance(signer1Address);
      const detailsMp = {
        listingAddress: signer2Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer2,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      const balanceAfter = await ethers.provider.getBalance(signer1Address);
      const after = new BigNumber(balanceAfter);
      const before = new BigNumber(balanceBefore);
      const diff = after.minus(before);
      expect(diff.toFixed()).to.equal(ethers.parseEther("10"));
    });
    it("3.3.6 Should be able to list and buy tokens after nft is not owned by the creator anymore", async () => {
      await mnft
        .connect(signer1)
        .safeTransferFrom(
          signer1Address,
          signer2Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer2Address, tokenIDnum2)).to.equal(1);
      await mnft
        .connect(signer2)
        .safeTransferFrom(
          signer2Address,
          signer3Address,
          tokenIDnum2,
          1,
          "0x00"
        );
      expect(await mnft.balanceOf(signer3Address, tokenIDnum2)).to.equal(1);
      const detailsMp = {
        listingAddress: signer3Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer3,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    });
    it("3.3.7 Should be able to purchase 1155 tokens [Creator quantity == Buyer quantity]", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 2,
        price: ethers.parseEther("10"), // cost
        listedIn: 1,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: tokenIDnum2,
        quantity: 2,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: ethers.parseEther("10"), // cost
        txnFees: 0,
        purchasingIn: 1,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );
      expect(voucher).to.not.be.null;
      expect(purchaseVoucher).to.not.be.null;
      const tx = await mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(2);
    });
    // it("3.3.8 Should be able to purchase 1155 tokens [Creator quantity != Buyer quantity]", async () => {
    //   const detailsMp = {
    //     listingAddress: signer1Address,
    //     tokenId: tokenIDnum2,
    //     quantity: 1,
    //     price: ethers.parseEther("10"), // cost
    //     listedIn: 1,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: tokenIDnum2,
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 1,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer1,
    //     true
    //   );
    //   expect(voucher).to.not.be.null;
    //   expect(purchaseVoucher).to.not.be.null;
    //   const tx = await mp
    //     .connect(owner)
    //     .purchaseNative(voucher, purchaseVoucher, {
    //       value: ethers.parseEther("21"),
    //     });
    //   expect(tx).to.not.be.reverted;
    //   expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    // });
    // it("3.3.9 Should Recieve the correct Price and Royality[1155]", async () => {
    //   const balanceBefore = await ethers.provider.getBalance(signer1Address);
    //   const detailsMp = {
    //     listingAddress: signer1Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 2,
    //     price: ethers.parseEther("10"), // cost
    //     listedIn: 1,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 1,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer1,
    //     true
    //   );
    //   expect(voucher).to.not.be.null;
    //   expect(purchaseVoucher).to.not.be.null;
    //   const tx = await mp
    //     .connect(owner)
    //     .purchaseNative(voucher, purchaseVoucher, ethers.toBigInt(2), {
    //       value: ethers.parseEther("21"),
    //     });
    //   expect(tx).to.not.be.reverted;
    //   const balanceAfter = await ethers.provider.getBalance(signer1Address);
    //   const after = new BigNumber(balanceAfter);
    //   const total = new BigNumber(balanceBefore);
    //   const before = total.plus(voucher.price).plus(ethers.parseEther("10"));
    //   expect(before.toFixed()).to.equal(after.toFixed());
    // });
    // it("3.3.10 Creator Should recieve the correct Royality[1155]", async () => {
    //   await mnft
    //     .connect(signer1)
    //     .safeTransferFrom(
    //       signer1Address,
    //       signer2Address,
    //       tokenIDnum2,
    //       1,
    //       "0x00"
    //     );
    //   const balanceBefore = await ethers.provider.getBalance(signer1Address);
    //   const detailsMp = {
    //     listingAddress: signer2Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     price: ethers.parseEther("10"), // cost
    //     listedIn: 1,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 1,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer2,
    //     true
    //   );
    //   expect(voucher).to.not.be.null;
    //   expect(purchaseVoucher).to.not.be.null;
    //   const tx = await mp
    //     .connect(owner)
    //     .purchaseNative(voucher, purchaseVoucher, ethers.toBigInt(2), {
    //       value: ethers.parseEther("21"),
    //     });
    //   expect(tx).to.not.be.reverted;
    //   const balanceAfter = await ethers.provider.getBalance(signer1Address);
    //   const after = new BigNumber(balanceAfter);
    //   const before = new BigNumber(balanceBefore);
    //   const diff = after.minus(before);
    //   expect(diff.toFixed()).to.equal(ethers.parseEther("10"));
    // });
    // it("3.3.11 Should emit event after purchase of 1155 tokens", async () => {
    //   const detailsMp = {
    //     listingAddress: signer1Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     price: ethers.parseEther("10"), // cost
    //     listedIn: 1,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 1,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer1,
    //     true
    //   );
    //   expect(voucher).to.not.be.null;
    //   expect(purchaseVoucher).to.not.be.null;
    //   expect(
    //     await await mp
    //       .connect(owner)
    //       .purchaseNative(voucher, purchaseVoucher, ethers.toBigInt(2), {
    //         value: ethers.parseEther("21"),
    //       })
    //   )
    //     .to.emit(mp, "purchaseSucessfull")
    //     .withArgs(anyValue, anyValue, anyValue);
    // });
    // it("3.3.12 Should emit event after a successfully after purchasing", async () => {
    //   await nft
    //     .connect(signer1)
    //     .transferFrom(signer1Address, signer2Address, tokenIDnum);
    //   expect(await nft.ownerOf(tokenIDnum)).to.equal(signer2Address);
    //   await nft
    //     .connect(signer2)
    //     .transferFrom(signer2Address, signer3Address, tokenIDnum);
    //   expect(await nft.ownerOf(tokenIDnum)).to.equal(signer3Address);
    //   const detailsMp = {
    //     listingAddress: signer3Address,
    //     tokenId: ethers.toBigInt(tokenId),
    //     quantity: 1,
    //     price: ethers.parseEther("10"), // cost
    //     listedIn: 1,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId),
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 1,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer3,
    //     true
    //   );
    //   expect(voucher).to.not.be.null;
    //   expect(purchaseVoucher).to.not.be.null;
    //   expect(
    //     await await mp
    //       .connect(owner)
    //       .purchaseNative(voucher, purchaseVoucher, ethers.toBigInt(1), {
    //         value: ethers.parseEther("21"),
    //       })
    //   )
    //     .to.emit(mp, "purchaseSucessfull")
    //     .withArgs(anyValue, anyValue, anyValue);
    // });
  });
});
