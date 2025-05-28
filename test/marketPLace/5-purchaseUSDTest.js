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

describe("5 Purchase USD Test", () => {
  let owner, signer1, signer2, signer3;
  let contractNFT, contract1155, contractMp, contractPunk;
  let nft, mnft, mp, token;
  let nftAddress, mnftAddress, mpAddress, tokenAddress;
  let ownerAddress, signer1Address, signer2Address, signer3Address;
  let func = contracts.metaMarketPlace.functions;
  let tokenId, tokenId2;
  let tokenIDnum, tokenIDnum2;
  let logicFactory, logicContract, logicAddress;
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
  // it("dddd", async () => {
  //   expect(1).to.equal(1);
  // });
  describe("5.1 Testing for proper Vouchers", () => {
    it("5.1.1 Should Revert if Valid vouchers are not passed", async () => {
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
        USDprice: ethers.parseEther("10"), // cost
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
        mp.connect(owner)[func.purchaseNative](voucher, purchaseVoucher)
      ).to.be.revertedWithCustomError(mp, errors.invalidBuyer);
    });
  });
  describe("5.2 Market Place test using USD", async () => {
    it("5.2.1 Should be able to list and Buy NFT if Valid vouchers are passed", async () => {
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
      const tx = await mp
        .connect(owner)
        [func.purchaseUSD](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    });
    it("5.2.2 Should be able to purchase the NFT even after the creator is not the owner of the NFT", async () => {
      await mnft.safeTransferFrom(
        signer1Address,
        signer2Address,
        tokenIDnum2,
        1,
        "0x00"
      );
      const detailsMp = {
        listingAddress: signer2Address,
        tokenId: tokenIDnum2,
        quantity: 1,
        price: 100, // cost
        listedIn: 2,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: signer3Address,
        purchaseId: tokenIDnum2,
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
    });
    it("5.2.3 Should emit events after a successfull Purchase", async () => {
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

      expect(
        await mp.connect(owner)[func.purchaseUSD](voucher, purchaseVoucher)
      )
        .to.emit(events.purchaseSucessfull)
        .withArgs(anyValue, anyValue, anyValue);
    });
    it("5.2.4 Should emit event to indicating the cost of in USD after a successfull Purchase for transfering Royality", async () => {
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
        owner,
        signer1,
        true
      );

      expect(
        await mp.connect(owner)[func.purchaseUSD](voucher, purchaseVoucher)
      )
        .to.emit(events.purchase)
        .withArgs(
          voucher.listingAddress,
          voucher.price,
          purchaseVoucher.USDprice,
          signer1Address
        );
    });
    it("5.2.5 Should Revert if the caller does not have the RELAYER_ROLE", async () => {
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
        price: ethers.parseEther("10"), // cost
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
        txnFees: 2,
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

      await expect(
        mp.connect(signer1)[func.purchaseUSD](voucher, purchaseVoucher)
      )
        .to.be.revertedWithCustomError(mp, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });
    // it("5.2.6 Should be able to list and buy 1155 tokens if valid vouchers are passed", async () => {
    //   const detailsMp = {
    //     listingAddress: signer1Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 2,
    //     price: 100, // cost
    //     listedIn: 2,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 2,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 2,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer1,
    //     true
    //   );

    //   const tx = await mp
    //     .connect(owner)
    //     [func.purchaseUSD](voucher, purchaseVoucher, 2);
    //   expect(tx).to.not.be.reverted;
    //   expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(2);
    // });
    // it("5.2.7 Should be able to list and buy 1155 tokens even if the owner of the token is not the creator", async () => {
    //   await mnft.safeTransferFrom(
    //     signer1Address,
    //     signer2Address,
    //     tokenIDnum2,
    //     1,
    //     "0x00"
    //   );
    //   const detailsMp = {
    //     listingAddress: signer2Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     price: 100, // cost
    //     listedIn: 2,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("100"), // cost
    //     txnFees: 0,
    //     purchasingIn: 2,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer2,
    //     true
    //   );

    //   const tx = await mp
    //     .connect(owner)
    //     [func.purchaseUSD](voucher, purchaseVoucher, 2);
    //   expect(tx).to.not.be.reverted;
    //   expect(await mnft.balanceOf(ownerAddress, tokenIDnum2)).to.equal(1);
    // });
    // it("5.2.8 Should emit event after a successfull Purchase [1155]", async () => {
    //   const detailsMp = {
    //     listingAddress: signer1Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 2,
    //     price: 100, // cost
    //     listedIn: 2,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: ownerAddress,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 2,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 2,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     owner,
    //     signer1,
    //     true
    //   );

    //   expect(
    //     await mp.connect(owner)[func.purchaseUSD](voucher, purchaseVoucher, 2)
    //   )
    //     .to.emit(events.purchaseSucessfull)
    //     .withArgs(anyValue, anyValue, anyValue);
    // });
    // it("5.2.9 Should emit event to indicating the cost of in USD after a successfull Purchase for transfering Royality [1155]", async () => {
    //   await mnft.safeTransferFrom(
    //     signer1Address,
    //     signer2Address,
    //     tokenIDnum2,
    //     1,
    //     "0x00"
    //   );
    //   const detailsMp = {
    //     listingAddress: signer2Address,
    //     tokenId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     price: 100, // cost
    //     listedIn: 2,
    //     start: 1, // start's From
    //     end: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //   };
    //   const detailsMpPurchase = {
    //     buyerAddress: signer3Address,
    //     purchaseId: ethers.toBigInt(tokenId2),
    //     quantity: 1,
    //     validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
    //     USDprice: ethers.parseEther("10"), // cost
    //     txnFees: 0,
    //     purchasingIn: 2,
    //   };
    //   const { voucher, purchaseVoucher } = await voucherGeneration(
    //     mp,
    //     detailsMp,
    //     detailsMpPurchase,
    //     signer3,
    //     signer2,
    //     true
    //   );

    //   expect(
    //     await mp.connect(owner)[func.purchaseUSD](voucher, purchaseVoucher, 2)
    //   )
    //     .to.emit(events.purchase)
    //     .withArgs(
    //       voucher.listingAddress,
    //       voucher.price,
    //       purchaseVoucher.USDprice,
    //       signer1Address
    //     );
    // });
  });
});
