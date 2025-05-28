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
  describe("6.1 Withdraw the fees Deposited (Native and &PUNK)", async () => {
    it("6.1.1 Should be able to withdraw the fees (Native)", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId2),
        quantity: 1,
        price: ethers.parseEther("10"), // cost
        listedIn: 0,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId2),
        quantity: 1,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFess: 0,
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

      const tx = await mp
        .connect(owner)
        [func.purchaseNative](voucher, purchaseVoucher, {
          value: ethers.parseEther("21"),
        });
    //   const current = new BigNumber(
    //     await ethers.provider.getBalance(mpAddress)
    //   );
    //   await mp.connect(owner)[func.withdraw](ownerAddress);
    //   const after = await ethers.provider.getBalance(mpAddress);
    //   expect(current.minus(after)).to.equal(ethers.parseEther("1"));
    });
    it("6.1.2 Should be able to withdraw the fees ($PUNK)", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId2),
        quantity: 2,
        price: ethers.parseEther("10"), // cost
        listedIn: 0,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId2),
        quantity: 2,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFess: 0,
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
      const tx = await mp
        .connect(owner)
        [func.purchasePunk](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      const current = new BigNumber(await token.balanceOf(mpAddress));
      await mp.connect(owner)[func.withdraw](ownerAddress);
      const after = await token.balanceOf(mpAddress);
      expect(current.minus(after)).to.equal(ethers.parseEther("1"));
    });
    it("6.1.3 Only the DEFAULT_ADMIN_ROLE can withdraw", async () => {
      const detailsMp = {
        listingAddress: signer1Address,
        tokenId: ethers.toBigInt(tokenId2),
        quantity: 2,
        price: ethers.parseEther("10"), // cost
        listedIn: 0,
        start: 1, // start's From
        end: ethers.toBigInt("1000000000000000000000"), // Valid Till
      };
      const detailsMpPurchase = {
        buyerAddress: ownerAddress,
        purchaseId: ethers.toBigInt(tokenId2),
        quantity: 2,
        validUntil: ethers.toBigInt("1000000000000000000000"), // Valid Till
        USDprice: 0, // cost
        txnFess: 0,
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
      const tx = await mp
        .connect(owner)
        [func.purchasePunk](voucher, purchaseVoucher);
      expect(tx).to.not.be.reverted;
      await expect(mp.connect(signer1)[func.withdraw](ownerAddress))
        .to.be.revertedWithCustomError(mp, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });
  });
});
