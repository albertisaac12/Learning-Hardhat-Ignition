const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  generateTokenId,
  getSignedVoucher,
} = require("./../../utils/voucherGen");
const { errors, contracts } = require("./../../utils/constants");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
describe("dappunkcreations Voucher Validation Test", () => {
  let owner, signer1, signer2, signer3;
  let ownerAddress, signer1Address, signer2Address, signer3Address;
  let contractFactory;
  let contract;
  let contractAddress;
  let func = contracts.dappunkCreations.functions;
  let tokenId;
  let tokenIDnum;
  let logicFactory, logicContract, logicAddress;
  beforeEach(async function () {
    [owner, signer1, signer2, signer3] = await ethers.getSigners();
    ownerAddress = owner.address;
    signer1Address = signer1.address;
    signer2Address = signer2.address;
    signer3Address = signer3.address;

    logicFactory = await ethers.getContractFactory(
      "contracts/Forwarder/forewarder.sol:logic"
    );
    logicContract = await logicFactory.connect(owner).deploy("meow");
    await logicContract.waitForDeployment();
    logicAddress = await logicContract.getAddress();

    contractFactory = await ethers.getContractFactory("dappunkCreations");
    contract = await contractFactory.deploy(
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      logicAddress,
    );

    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("1 Voucher Validation Test", () => {
    it("1.1 Voucher should be valid even when voucher.quantity==1", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("1"),
        buyerQty: ethers.toBigInt("1"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      expect(await contract[func.verifyVoucher](voucher)).to.not.be.reverted;
    });
    it("1.2 Voucher should be valid even when voucher.quantity>1", async () => {
      tokenId = generateTokenId(signer2.address, 1, 5);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("1"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      expect(await contract[func.verifyVoucher](voucher)).to.not.be.reverted;
    });

    it("1.3 Should revert if the voucher is altered after voucher generation", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("1"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      voucher.price = 0;

      await expect(contract[func.verifyVoucher](voucher))
        .to.be.revertedWithCustomError(contractFactory, errors.invalidPrice)
        .withArgs(anyValue, anyValue);
    });
    it("1.4 Should revert if the signatures are altered", async () => {
      tokenId = generateTokenId(signer2.address, 1, 12);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("1"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );
      let creator = voucher.creator;
      voucher.creator = voucher.validator;

      await expect(
        contract[func.verifyVoucher](voucher)
      ).to.be.reverted;

      voucher.creator = creator;
      voucher.validator = creator;

      await expect(
        contract[func.verifyVoucher](voucher)
      ).to.be.reverted;
    });
   
    it("1.5 Should revert if the buyerQty is more than tokenQuantity", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("6"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      await expect(contract[func.verifyVoucher](voucher))
        .to.be.revertedWithCustomError(contractFactory, errors.invalidTokenQty)
        .withArgs(anyValue, anyValue, anyValue);
    });
    it("1.6 Should revert if all the items have already been minted", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("5"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      await contract[func.mintApi](voucher, signer1Address);
      expect(await contract.balanceOf(signer1Address, tokenIDnum)).to.equal(5);

      await expect(contract[func.mintApi](voucher, signer1Address))
        .to.be.revertedWithCustomError(contract, errors.invalidTokenQty)
        .withArgs(anyValue, anyValue, anyValue);
    });
    it("1.7 Should revert if voucher.quantity is 0", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("5"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );
      voucher.quantity = 0;
      await expect(contract[func.verifyVoucher](voucher))
        .to.be.revertedWithCustomError(contract, errors.invalidTokenQty)
        .withArgs(anyValue, anyValue, anyValue);
    });
    it("1.8 Should return the creator address if voucher is validated", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("5"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      const retrievedAddress = await contract[func.verifyVoucher](voucher);
      expect(retrievedAddress).to.equal(signer2Address);
    });
    it("1.9 Should revert if the block.timestamp < voucher.start", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("5"),
        start: ethers.toBigInt("10000000000000000000000000000000000000000000"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      await expect(contract[func.verifyVoucher](voucher))
        .to.be.revertedWithCustomError(contract, errors.tokenSaleNotStarted)
        .withArgs(anyValue, anyValue, anyValue);
    });
    it("1.10 Should revert if the block.timestamp > voucher.end", async () => {
      tokenId = generateTokenId(signer2.address, 1, 1);
      tokenIDnum = ethers.toBigInt(tokenId.toString());
      const values = {
        tokenId: tokenIDnum,
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("5"),
        buyerQty: ethers.toBigInt("5"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("1"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
      const voucher = await getSignedVoucher(
        contract,
        "1155",
        values,
        signer2,
        owner
      );

      await expect(contract[func.verifyVoucher](voucher))
        .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
        .withArgs(anyValue, anyValue, anyValue);
    });
  });
});
