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
const { any } = require("hardhat/internal/core/params/argumentTypes");

describe("6 Withdraw Funds Test", () => {
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
    // await owner.sendTransaction({
    //   value: ethers.parseEther("1"),
    //   to: mnftAddress,
    // });

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
      quantity: 15,
      buyerQty: 2,
    };

    // const value2 = getMsgValue(details2.price, false, false, details2.buyerQty);
    // // console.log(value2);

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
  describe("9 Misc Test", async () => {
    it("9.1 Should Revert if Token address is set to zero", async () => {
        await expect(mp.connect(owner).setTokenAddress("0x0000000000000000000000000000000000000000")).to.be.reverted;
        await expect(mp.connect(signer1).setTokenAddress("0x0000000000000000000000000000000000000000")).to.be.revertedWithCustomError(mp,errors.acUnauthorized);
    });
    it("9.2 Should Revert if Token quantity is more than balance (Native)", async () => {
          expect(await mnft[func.hasRole](roles.MARKET_PLACE, mpAddress)).to.equal(
        true
      );
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 10000000,
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

     await expect (mp
        .connect(owner)
        .purchaseNative(voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        })).to.be.revertedWithCustomError(mp,"invalidTokenQuantity");   
      
    });
    it("9.3 Should Revert if Token quantity is more than balance (Punk)", async () => {
          expect(await mnft[func.hasRole](roles.MARKET_PLACE, mpAddress)).to.equal(
        true
      );
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 15000,
        price: ethers.parseEther("10"), // cost
        listedIn: 0,
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
        purchasingIn: 0,
      };
      const { voucher, purchaseVoucher } = await voucherGeneration(
        mp,
        detailsMp,
        detailsMpPurchase,
        owner,
        signer1,
        true
      );

      await expect(mp
        .connect(owner)
        [func.purchasePunk](voucher, purchaseVoucher)).to.be.revertedWithCustomError(mp,"invalidTokenQuantity");
    });
    it("9.4 Should Revert if Token quantity is more than balance (USD)", async () => {
        const detailsMp = {
        listingAddress: signer1Address,
        tokenId: tokenIDnum2,
        quantity: 111111,
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
      await expect(mp
        .connect(owner)
        [func.purchaseUSD](voucher, purchaseVoucher)).to.be.revertedWithCustomError(mp,"invalidTokenQuantity");
    });
    it("9.5 Should be able to update PlatformFees", async () => {
      await mp.connect(owner).updatePlatFormFees(205);
      expect(await mp.platformFees()).to.equal(205);
    });
    it("9.6 Only Manager should be able to update PlatformFees", async () => {
      await expect(mp.connect(signer1).updatePlatFormFees(205)).to.be.revertedWithCustomError(mp,errors.acUnauthorized);
    });
    it("9.7 SetCreationsAddress Test", async () => {
      const tx = mp.connect(owner).setCreationsAddress(owner.address);
      expect(tx).to.not.be.reverted;
      await expect(mp.connect(owner).setCreationsAddress("0x0000000000000000000000000000000000000000")).to.be.revertedWithCustomError(mp,"setNonZeroCreationsAddress");
      await expect(mp.connect(signer1).setCreationsAddress(owner.address)).to.be.revertedWithCustomError(mp,errors.acUnauthorized);
    });
  });
});
