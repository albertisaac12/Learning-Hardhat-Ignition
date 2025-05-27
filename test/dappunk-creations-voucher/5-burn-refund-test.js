const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./../../utils/constants");

const {
  generateTokenId,
  getSignedVoucher,
  getMsgValue,
} = require("./../../utils/voucherGen");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const contractConst = constants.contracts.dappunkCreations;
const contractPath = contractConst.file;
const usdtPath = constants.contracts.test.files.usdt;
const dpPath = constants.contracts.test.files.dpToken;
const errors = constants.errors;
const events = constants.events;
const roles = constants.roles;
const types = constants.types.ERC1155;
let logicFactory, logicContract, logicAddress;
// Defining the specific NFT minting functions
const addToken = contractConst.functions.addSupportedToken;

let tokenIndex = 0;

it.todo = function (title, callback) {
  return it.skip("TODO: " + title, callback);
};

describe("4. Other Functionality", () => {
  let owner,
    addr1,
    addr2,
    addr3,
    addr4,
    addr5,
    addr6,
    addr7,
    addr8,
    addr9,
    addr10,
    addr11;
  let contractAddress, contract, ownerAddress;
  let address1,
    address2,
    address3,
    address4,
    address5,
    address6,
    address7,
    address8,
    address9,
    address10,
    address11;
  beforeEach(async function () {
     [
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
      addr7,
      addr8,
      addr9,
      addr10,
      addr11,
    ] = await ethers.getSigners();
    ownerAddress = owner.address;
    address1 = addr1.address;
    address2 = addr2.address;
    address3 = addr3.address;
    address4 = addr4.address;
    address5 = addr5.address;
    address6 = addr6.address;
    address7 = addr7.address;
    address8 = addr8.address;
    address9 = addr9.address;
    address10 = addr10.address;
    address11 = addr11.address;
    const mintingContractFactory = await ethers.getContractFactory(
      contractPath
    );
    logicFactory = await ethers.getContractFactory(
      "contracts/Forwarder/forewarder.sol:logic"
    );
    logicContract = await logicFactory.connect(owner).deploy("meow");
    await logicContract.waitForDeployment();
    logicAddress = await logicContract.getAddress();
    contract = await mintingContractFactory.deploy(
      ownerAddress, // manager
      address1, // minter
      address2, // fundManager
      address3, // agencyManager
      address4, // contractApprover
      address5, // mintValidator
      address6, // refundManager
      logicAddress, // forwarder
    );
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
    // console.log(contratAddress);
  });

  describe("4.1 Burning", () => {
    const details = {
      price: 10,
      quantity: 10,
      buyerQty: 1,
      start: 0,
      end: 0,
      royalty: 100,
      stealth: false,
      sbt: false,
      tokenAdr: null,
    };

    let tempTokenId;

    it("Should not allow burning non existent NFT", async () => {
      await expect(contract.connect(owner)["burn(uint256,uint256)"](1, 1)).to.be
        .reverted;
    });

    it("Should allow owner of NFT to burn their NFT", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;

      const tokenId = generateTokenId(addr1.address, 1, tokenIndex++, 2);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, addr2.address);
      await expect(await tx).to.not.be.reverted;
      expect(await contract.balanceOf(addr2.address, tokenId)).to.equal(1);

      let burn = contract.connect(buyer).burn(tokenId, 1);

      await expect(burn)
        .to.emit(contract, events.transferSingle)
        .withArgs(buyer, buyer, ethers.ZeroAddress, tokenId, 1);

      await expect(burn).to.emit(contract, events.burnt).withArgs(tokenId, 1);
    });

    it("Should not allow burning NFT not owned by them", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;

      const tokenId = generateTokenId(addr1.address, 1, tokenIndex++, 2);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, addr2.address);
      await expect(await tx).to.not.be.reverted;
      expect(await contract.balanceOf(addr2.address, tokenId)).to.equal(1);
      await expect(contract.connect(addr5)["burn"](tokenId, 1)).to.be.reverted;
    });

    it("Should not allow admin to burn an NFT", async () => {
      const validator = addr5;
      const tokenId = 1;

      let burn = contract.connect(validator).burn(tokenId, 1);

      await expect(burn).to.be.reverted;
    });

    it("Should not allow previous owner to burn an NFT", async () => {
      const creator = addr1;
      const buyer = addr2;
      const secondBuyer = addr3;
      const validator = addr5;

      const tokenId = generateTokenId(addr1.address, 1, tokenIndex++, 2);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, addr2.address);

      expect(await tx).to.not.be.reverted;
      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);
      await expect(
        await contract
          .connect(buyer)
          .safeTransferFrom(
            buyer.address,
            secondBuyer.address,
            tokenId,
            1,
            "0x00"
          )
      ).to.not.be.reverted;

      let burn = contract.connect(buyer).burn(tokenId, 1);

      await expect(burn).to.be.reverted;
    });

    it("Should allow owner of NFTs to burn their NFTs till all are burnt", async () => {
      const contractFunc = contractConst.functions.mintApi;
      const creator = addr1;
      const creatorWallet = await creator.getAddress();
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr1.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      await expect(
        contract.connect(addr1)[contractFunc](voucher, buyer.address)
      ).to.not.be.reverted;

      expect(await contract.tokenMintedQty(tokenId)).to.equal(1);
      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      await expect(
        contract.connect(addr1)[contractFunc](voucher, buyer.address)
      ).to.not.be.reverted;

      expect(await contract.tokenMintedQty(tokenId)).to.equal(2);
      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(2);

      await expect(contract.connect(buyer).burn(tokenId, 1))
        .to.emit(contract, events.transferSingle)
        .withArgs(buyer, buyer, ethers.ZeroAddress, tokenId, 1);

      await expect(contract.connect(buyer).burn(tokenId, 1))
        .to.emit(contract, events.transferSingle)
        .withArgs(buyer, buyer, ethers.ZeroAddress, tokenId, 1);

      expect(await contract.tokenMintedQty(tokenId)).to.equal(0);
      expect(await contract.tokenMaxQty(tokenId)).to.equal(0);
      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(0);
      tokenIndex++;
    });

    it("Should allow owner of NFTs to burn all the qty of one token at once", async () => {
      const contractFunc = contractConst.functions.mintApi;
      const creator = addr5;
      const creatorWallet = await creator.getAddress();
      const buyer = addr6;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++, 2);

      const values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 2,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      await expect(
        contract.connect(addr1)[contractFunc](voucher, buyer.address)
      ).to.not.be.reverted;

      expect(await contract.tokenMintedQty(tokenId)).to.equal(2);
      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(2);

      await expect(contract.connect(buyer).burn(tokenId, 2))
        .to.emit(contract, events.transferSingle)
        .withArgs(buyer, buyer, ethers.ZeroAddress, tokenId, 2);

      expect(await contract.tokenMintedQty(tokenId)).to.equal(0);
      expect(await contract.tokenMaxQty(tokenId)).to.equal(0);
      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(0);
      tokenIndex++;
    });
  });

  describe("4.2 Refund", () => {
    const details = {
      price: 10,
      quantity: 10,
      buyerQty: 1,
      start: 0,
      end: 0,
      royalty: 100,
      stealth: false,
      sbt: false,
      tokenAdr: null,
    };

    it("Should allow admin to refund an NFT", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      const refund = contract
        .connect(addr6)
        .refundNFT(tokenId, creator.address, buyer.address, voucher.buyerQty);

      await expect(refund)
        .to.emit(contract, events.transferSingle)
        .withArgs(addr6.address, buyer, creator, tokenId, 1);
    });

    it("Should not allow unauthorized user to refund an NFT", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      await expect(
        contract
          .connect(addr7)
          .refundNFT(tokenId, creator.address, buyer.address, voucher.buyerQty)
      )
        .to.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should not allow owner of NFT to refund", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      await expect(
        contract
          .connect(buyer)
          .refundNFT(tokenId, creator.address, buyer.address, voucher.buyerQty)
      )
        .to.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
      // await expect(refund)
      //   .to.revertedWithCustomError(contract, errors.accessDenied)
      //   .withArgs(roles.REFUND_MANAGER_ROLE, buyer.address);
    });

    it("Should not allow creator of NFT to refund", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      await expect(
        contract
          .connect(creator)
          .refundNFT(tokenId, creator.address, buyer.address, voucher.buyerQty)
      )
        .to.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should not refund NFT if wrong owner is specified", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      let refund = contract
        .connect(addr6)
        .refundNFT(tokenId, creator.address, addr7.address, voucher.buyerQty);

      await expect(refund)
        .to.be.revertedWithCustomError(contract, errors.notTokenOwner)
        .withArgs(addr7.address, tokenId, details.buyerQty);
    });

    it("Should not refund NFT if wrong creator is specified", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      let refund = contract
        .connect(addr6)
        .refundNFT(tokenId, addr8.address, buyer.address, voucher.buyerQty);
      await expect(refund)
        .to.be.revertedWithCustomError(contract, errors.notTokenCreator)
        .withArgs(addr8.address, tokenId);
    });

    it("Should not refund not nonExistant token", async () => {
      const creator = ethers.ZeroAddress;
      const buyer = ethers.ZeroAddress;
      const validator = addr5;
      const tokenId = 0;

      let refund = contract
        .connect(addr6)
        .refundNFT(tokenId, creator, buyer, 1);

      await expect(refund)
        .to.revertedWithCustomError(contract, errors.notTokenOwner)
        .withArgs(buyer, tokenId, 1);
    });
  });

  describe("4.3 SBT", () => {
    const details = {
      price: 10,
      quantity: 10,
      buyerQty: 1,
      start: 0,
      end: 0,
      royalty: 100,
      stealth: false,
      sbt: true,
      tokenAdr: null,
    };

    it("Should mint NFT as SBT - NonTransferable", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: true,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);
      await expect(tx).to.emit(contract, events.locked).withArgs(tokenId);
      expect(await contract.locked(tokenId)).to.equal(true);
    });

    it("Should not allow SBT to be resold/transferred", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: true,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);
      await expect(tx).to.emit(contract, events.locked).withArgs(tokenId);

      await expect(
        contract
          .connect(buyer)
          .safeTransferFrom(buyer, addr4.address, tokenId, 1, "0x00")
      ).to.be.revertedWithCustomError(contract, errors.nonTransferableToken);
    });

    it("Should allow NFT owner to burn their SBT", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: true,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      await expect(tx).to.emit(contract, events.locked).withArgs(tokenId);

      await expect(contract.connect(buyer).burn(tokenId, 1)).to.not.be.reverted;
      // .to.be.revertedWith("contract, errors.nonTransferableToken")
      // .to.be.revertedWithCustomError(contract, errors.accessDenied)
      // .withArgs();
    });

    it("Should allow admin to refund an SBT", async () => {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(addr3.address, 1, tokenIndex++, 2);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 10,
        isStealth: false,
        isSbt: true,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, buyer.address);

      expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(buyer.address, tokenId)).to.equal(1);

      await expect(tx).to.emit(contract, events.locked).withArgs(tokenId);

      let refund = contract
        .connect(addr6)
        .refundNFT(tokenId, creator.address, buyer.address, 1);

      await expect(refund)
        .to.emit(contract, events.transferSingle)
        .withArgs(addr6.address, buyer, creator, tokenId, 1);
    });
  });
});
