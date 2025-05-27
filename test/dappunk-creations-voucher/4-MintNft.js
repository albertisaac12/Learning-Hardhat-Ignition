const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const constants = require("./../../utils/constants");
const {
  generateTokenId,
  getMsgValue,
  getSignedVoucher,
  getFee,
  getAgencyFee,
} = require("./../../utils/voucherGen");


const royaltyMultiplier = constants.royaltyMultiplier;
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

let tokenIndex = 300;

it.todo = function (title, callback) {
  return it.skip("TODO: " + title, callback);
};

describe("5. dpCreations Minting NFT", function () {
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
  let contractAdr, contract, ownerAddress;
  let usdtToken, usdtTokenAdr, usdcToken, usdcTokenAdr, dpToken, dpTokenAdr;
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
    logicFactory = await ethers.getContractFactory(
      "contracts/Forwarder/forewarder.sol:logic"
    );
    logicContract = await logicFactory.connect(owner).deploy("meow");
    await logicContract.waitForDeployment();
    logicAddress = await logicContract.getAddress();

    const contractFactory = await ethers.getContractFactory(contractPath);
    contract = await contractFactory.deploy(
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
    contractAdr = await contract.getAddress();
  });

  describe("3.1 Mint NFT via API", function () {
    const contractFunc = contractConst.functions.mintApi;

    let details = {
      quantity: 10,
      buyerQty: 1,
      price: 0.01,
      start: 0,
      end: 0,
      royalty: 100,
      stealth: false,
      sbt: false,
      tokenAdr: null,
    };

    it("Should mint NFT via API call", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;

    
      const tkId = generateTokenId(address1, 1, 1);
   
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );

      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);
    });

    it("Should mint another NFT via API call", async function () {
      const creator = addr3;
      const buyer = addr4;
      const validator = addr5;

      details.price = 200;

      const tkId = generateTokenId(address3, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address4);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address4, vr.tokenId)).to.equal(1);
    });

    it("Should not mint when tokenId doesn't match creator", async function () {
      // const creator = addr1;
      const creatorWallet = address1;
      const buyerWallet = address4;
      const wrongSigner = addr2;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
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
        wrongSigner,
        addr5
      );
      // console.log(voucher);

      await expect(
        contract
          .connect(addr1)
          [
            "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](voucher, buyerWallet)
      )
        .to.be.revertedWithCustomError(contract, "InvalidCreator")
        .withArgs(wrongSigner);
    });

    it("Should not mint if validated with unauthorized wallet", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyerWallet = address4;
      const validator = addr5;
      const wrongValidator = owner;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);

      let values = {
        price: getMsgValue(0.01, false),
        tokenId: tokenId,
        quantity: 10,
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
        wrongValidator
      );
      await expect(
        contract.connect(addr1)[contractFunc](voucher, buyerWallet)
      )
        .to.be.revertedWithCustomError(contract, "InvalidValidator");
    });

    it("Should not mint if called by unauthorized wallet", async function () {
      const creator = addr2;
      const creatorWallet = address2;
      const buyerWallet = address4;
      const validator = addr5;
      const wrongCaller = addr2;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
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
        addr5
      );

      await expect(
        contract.connect(wrongCaller)[contractFunc](voucher, buyerWallet)
      )
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow minting of same token again", async function () {
      const creator = addr1;
      const buyer = addr4;
      const validator = addr5;
      const creatorWallet = address1;
      const buyerWallet = address4;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
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
        addr5
      );

      expect(
        await contract.connect(addr1)[contractFunc](voucher, buyerWallet)
      ).not.be.reverted;
      expect(await contract.balanceOf(buyer, tokenId)).to.equal(1);

      expect(await contract.connect(addr1)[contractFunc](voucher, address2));

      expect(await contract.balanceOf(buyer, tokenId)).to.equal(1);
    });

    it("Should lock a non-transferable token", async function () {
      const creator = addr1;
      const buyer = addr4;
      const validator = addr5;

      const details = {
        price: 20,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        stealth: false,
        sbt: true,
        tokenAdr: null,
      };

     

      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: true,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );

    //   await contract.grantRole(roles.REFUND_MANAGER_ROLE,);
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address4);
      await expect(tx).to.emit(contract, events.locked).withArgs(vr.tokenId);

      expect(await contract.balanceOf(address4, vr.tokenId)).to.equal(1);
      expect(await contract.locked(vr.tokenId)).to.equal(true);
    });

    it("Should return correct url for stealth NFT", async function () {
      const creator = addr1;
      const buyer = addr4;
      const validator = addr5;

      const details = {
        price: 20,
        royalty: 10,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        stealth: true,
        sbt: false,
        tokenAdr: null,
      };

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "api",
      //   tokenIndex++
      // );
      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: true,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address4);
      await expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address4, vr.tokenId)).to.equal(1);
      expect(await contract.uri(vr.tokenId)).to.equal(
        contractConst.defaultValues.stealthUrl
      );
    });

    it("Should not mint if price is set to 0", async function () {
      const creator = addr1;
      const buyer = addr4;
      const validator = addr5;

      const setPrice = 0;

      const details = {
        price: setPrice,
        royalty: 10,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "api",
      //   tokenIndex++
      // );
      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );
      await expect(
        contract
          .connect(addr1)
          [
            "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](vr, address4)
      )
        .to.be.revertedWithCustomError(contract, errors.invalidPrice)
        .withArgs(vr.tokenId, 0);
    });

    it("Should mint nft for pioneer", async function () {
      const creator = addr9;
      const creatorWallet = address9;
      const buyerWallet = address5;

      // Add creator as Pioneer
      expect(await contract.connect(addr3).addPioneer(address9)).to.not.be
        .reverted;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);

      let values = {
        price: getMsgValue(10, false),
        tokenId: tokenId,
        quantity: 10,
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
        addr5
      );

      expect(await contract.connect(addr1)[contractFunc](voucher, buyerWallet))
        .to.not.be.reverted;

      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);
    });

    it("Should allow minting a token that has started", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 3;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(delayBy * 2);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "api",
      //   tokenIndex++
      // );

      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);

      await expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);
    });

    it("Should allow minting a token that has not ended", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 60;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0, // Add 3 seconds to timer
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(10);

      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);

      await expect(tx).to.not.be.reverted;

      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);
    });

    it("Should not allow minting a token if mint time has not started", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 60;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      // await time.increase(delayBy * 2);

      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );
      const blockTimeStamp = await time.latest();
      await expect(
        contract
          .connect(addr1)
          [
            "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](vr, address2)
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleNotStarted)
        .withArgs(vr.tokenId, start, blockTimeStamp + 1);

      // await expect(tx).to.not.be.reverted;

      // expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);

      // await expect(tx)
      //   .to.be.revertedWithCustomError(contract, errors.tokenSaleNotStarted)
      //   .withArgs(tokenId, start, blockTimeStamp + 1);
    });

    it("Should not allow minting if mint time has ended", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 10;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(delayBy * 2);

      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther(details.price.toString()),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };
      // console.log(valuess);
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        creator,
        addr5
      );

      const blockTimeStamp = await time.latest();
      await expect(
        contract
          .connect(addr1)
          [
            "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](vr, address2)
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
        .withArgs(vr.tokenId, end, blockTimeStamp + 1);

      // await expect(tx)
      //   .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
      //   .withArgs(tokenId, end, blockTimeStamp + 1);
    });

    it.todo("Should mint nft for an agency's creator", async function () {});
    it.todo(
      "Should ensure agency and creator get correct token amount",
      async function () {}
    );
  });

  describe("3.2 Mint NFT via Native Crypto", function () {
    const contractFunc = contractConst.functions.mintNative;

    it("Should mint NFT successfully with native token", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0.02, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0.02"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      // console.log(voucher);
      const tx = await contract
        .connect(addr4)
        [
          "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, address4, { value: ethers.parseEther("0.02") });
      expect(tx).to.not.be.reverted;
      // expect(await contract.connect(buyer)[contractFunc](voucher, options)).to
      //   .not.be.reverted;

      expect(await contract.balanceOf(buyerWallet, voucher.tokenId)).to.equal(
        1
      );
    });

    it("Should not mint if no value is passed", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0.02, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0.02"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      // console.log(voucher);
      await expect(
        contract
          .connect(addr4)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](voucher, address4)
      ).to.be.revertedWithCustomError(contract, "InsufficientBalance()");
    });

    it("Should not mint if 0 value is passed", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0.02, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0.02"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      // console.log(voucher);
      await expect(
        contract
          .connect(addr4)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](voucher, address4, { value: 0 })
      ).to.be.revertedWithCustomError(contract, errors.insufficientBalance);
    });

    it("Should not mint if price is set to 0", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      // const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      // console.log(voucher);
      await expect(
        contract
          .connect(addr4)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](voucher, address4)
      )
        .to.be.revertedWithCustomError(contract, errors.invalidPrice)
        .withArgs(tokenId, 0);
    });

    it("Should receive funds on successful mint", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };
      const balanceBefore = await ethers.provider.getBalance(contractAdr);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      expect(
        await contract
          .connect(buyer)
          [contractFunc](voucher, buyer.address, options)
      ).to.not.be.reverted;

      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);

      const balance = await ethers.provider.getBalance(contractAdr);
      expect(balance).to.equal(balanceBefore + getFee(price));
    });

    it("Should not mint when tokenId doesn't match creator", async function () {
      // const creator = addr1;
      const creatorWallet = address1;
      const buyerWallet = address4;
      const wrongSigner = addr2;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
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
        wrongSigner,
        addr5
      );

      await expect(
        contract.connect(owner)[contractFunc](voucher, owner.address)
      )
        .to.be.revertedWithCustomError(contract, "InvalidCreator")
        .withArgs(wrongSigner);
    });

    it("Should not mint when voucher is not correct", async function () {
      const chainId = constants.chainId;

      const creator = addr2;
      const creatorWallet = address2;
      const buyer = addr5;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = false;
      const sbt = false;

      const royaltyVal = royalty * royaltyMultiplier;
      let voucher = {
        tokenId,
        price: ethers.toBigInt(value),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royaltyVal,
        isStealth: stealth,
        isSbt: sbt,
      };

      const domain = {
        name: "randomString",
        version: contractConst.domain.version,
        verifyingContract: contractAdr,
        chainId: chainId,
      };

      const creatorSign = await creator.signTypedData(domain, types, voucher);
      const validatorSign = await validator.signTypedData(
        domain,
        types,
        voucher
      );
      voucher = { ...voucher, creator: creatorSign, validator: validatorSign };

      const options = { value: value };
      await expect(
        contract.connect(buyer)[contractFunc](voucher, buyer.address, options)
      ).to.be.revertedWithCustomError(contract, "InvalidCreator");
    });

    it("Should not mint when signed by unauthorized validator", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr3;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      await expect(
        contract.connect(buyer)[contractFunc](voucher, buyer.address, options)
      )
        .to.be.revertedWithCustomError(contract, "InvalidValidator")
        .withArgs(validator);
    });

    it("Should mint for pioneer", async function () {
      const creator = addr10;
      const creatorWallet = address10;
      const buyer = addr5;
      const buyerWallet = address5;
      const validator = addr5;

      // Add Creator as Pioneer
      expect(await contract.connect(addr3).addPioneer(creator.address)).to.not.be
        .reverted;
      const creatorBalBefore = BigInt(
        await ethers.provider.getBalance(creator.address)
      );
      const contractBalBefore = BigInt(
        await ethers.provider.getBalance(contract)
      );

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      expect(
        await contract
          .connect(buyer)
          [contractFunc](voucher, buyer.address, options)
      ).to.not.be.reverted;

      // Verify Token Purchase
      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);

      // Calculate the balances
      const creatorBalAfter = BigInt(await ethers.provider.getBalance(creator.address));
      const contractBalAfter = BigInt(
        await ethers.provider.getBalance(contract)
      );
      const fee = getFee(price, true);
      const creatorAmount = creatorBalBefore + BigInt(value) - fee;
      expect(creatorBalAfter).to.equal(creatorAmount);
      expect(contractBalAfter).to.equal(contractBalBefore + fee);
    });

    it("Should mint for an agency's creator", async function () {
      const creator = addr10;
      const buyer = addr5;
      const validator = addr5;

      // Add Agency - 2.5% = 250
      const agency = addr6;
      const agencyFee = 250;
      expect(await contract.connect(addr3).addAgency(address6, agencyFee)).to
        .not.be.reverted;
      expect(await contract.connect(addr3).addCreator(address6, [address10])).to
        .not.be.reverted;

      // Add Creator to Agency
      const creatorBalBefore = BigInt(
        await ethers.provider.getBalance(address10)
      );
      const contractBalBefore = BigInt(
        await ethers.provider.getBalance(contractAdr)
      );
      const agencyBalBefore = BigInt(
        await ethers.provider.getBalance(address6)
      );

      const details = {
        price: 0.02,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
      };

      const value = getMsgValue(details.price, false);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "native",
      //   tokenIndex++
      // );
      const tokenId = generateTokenId(address10, 1, tokenIndex++);
      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      const tx = await contract
        .connect(buyer)
        [contractFunc](voucher, buyer.address, options);
      await expect(tx).to.not.be.reverted;

      // Verify Token Purchase
      expect(await contract.balanceOf(address5, tokenId)).to.equal(1);

      // Calculate the balances
      const creatorBalAfter = BigInt(
        await ethers.provider.getBalance(address10)
      );
      const contractBalAfter = BigInt(
        await ethers.provider.getBalance(contractAdr)
      );
      const agencyBalAfter = BigInt(await ethers.provider.getBalance(address6));
      const platformFeeCalc = getFee(details.price, true);
      const agencyFeeCalc = getAgencyFee(details.price, agencyFee);
      // const fee = platformFeeCalc + agencyFeeCalc;
      const creatorAmount =
        creatorBalBefore +
        BigInt(value) -
        platformFeeCalc -
        BigInt(1000000000000000);
      expect(creatorBalAfter).to.equal(creatorAmount);
      expect(contractBalAfter).to.equal(
        contractBalBefore + platformFeeCalc + agencyFeeCalc
      );
      expect(agencyBalAfter).to.equal(agencyBalBefore + agencyFeeCalc);
    });

    it("Should allow minting a token that has started", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 3;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(delayBy * 2);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "native",
      //   tokenIndex++
      // );
      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: start,
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
        addr5
      );
      const tx = await contract
        .connect(addr2)
        [
          "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, address2, { value: value });
      await expect(tx).to.not.be.reverted;
      // await expect(await tx).to.be.revertedWithCustomError(contract, errors.deprecated);

      expect(await contract.balanceOf(address2, tokenId)).to.equal(1);
    });

    it("Should allow minting a token that has not ended", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();
      // console.log("now: ", now);

      const delayBy = 60;
      const end = now + delayBy;
      // console.log("end: ", end);
      // console.log("block: ", await time.latest());

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0, // Add 3 seconds to timer
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(10);
      // console.log("block: ", await time.latest());

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      const tx = await contract
        .connect(addr2)
        [
          "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](voucher, address2, { value: value });
      await expect(tx).to.not.be.reverted;
      // await expect(await tx).to.be.revertedWithCustomError(contract, errors.deprecated);

      expect(await contract.balanceOf(address2, tokenId)).to.equal(1);
    });

    it("Should not allow minting a token if mint time has not started", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 60;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: start,
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
        addr5
      );

      const blockTimeStamp = await time.latest();

      await expect(
        contract
          .connect(addr2)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](voucher, address2, { value: value })
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleNotStarted)
        .withArgs(tokenId, start, blockTimeStamp + 1);
    });

    it("Should not allow minting if mint time has ended", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 10;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(delayBy * 2);

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );

      const blockTimeStamp = await time.latest();

      await expect(
        contract
          .connect(addr2)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](voucher, address2, { value: value })
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
        .withArgs(tokenId, end, blockTimeStamp + 1);
    });
  });

  describe("3.3 Mint NFT via ERC20 Tokens", function () {
    const contractFunc = contractConst.functions.mintToken;

    beforeEach(async function () {
      const usdtFactory = await ethers.getContractFactory(usdtPath);
      usdtToken = await usdtFactory.deploy();
      await usdtToken.waitForDeployment();
      usdtTokenAdr = await usdtToken.getAddress();

      usdcToken = await usdtFactory.deploy();
      await usdcToken.waitForDeployment();
      usdcTokenAdr = await usdcToken.getAddress();

      const dpTokenFactory = await ethers.getContractFactory(dpPath);
      dpToken = await dpTokenFactory.deploy();
      await dpToken.waitForDeployment();
      dpTokenAdr = await dpToken.getAddress();

      await contract.connect(owner)[addToken](usdtTokenAdr);
      // await contract.connect(owner)[addToken](usdcTokenAdr);
      // await contract.connect(owner)[addToken](dpTokenAdr);
    });

    it("Should mint with supported token", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = owner;
      const buyerWallet = ownerAddress;
      const validator = addr5;

      const details = {
        price: 0.02,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
        tokenAdr: usdtTokenAdr,
      };
      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 100;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
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
        addr5
      );

      await usdtToken.connect(owner).approve(contractAdr, value);
      const tx = await contract
        .connect(owner)
        [
          "mintNftWithToken((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address,address)"
        ](voucher, usdtTokenAdr, owner.address);

      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);
      // const value = getMsgValue(details.price, false);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "token",
      //   tokenIndex++
      // );

      // await expect(tx).to.not.be.reverted;

      // expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);
    });

    it("Should not mint with unsupported token", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = owner;
      const buyerWallet = ownerAddress;
      const validator = addr5;

      const details = {
        price: 0.02,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
        tokenAdr: usdtTokenAdr,
      };
      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 100;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
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
        addr5
      );

      // await usdtToken.connect(owner).approve(contractAdr, value);
      await expect(
        contract
          .connect(owner)
          [
            "mintNftWithToken((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address,address)"
          ](voucher, usdcTokenAdr, owner.address)
      )
        .to.be.revertedWithCustomError(contract, errors.notSupported)
        .withArgs(usdcTokenAdr);
    });

    it("Should mint with another supported token", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = owner;
      const buyerWallet = ownerAddress;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 100;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await contract.connect(owner)[addToken](usdcTokenAdr);

      await usdcToken.connect(owner).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      expect(
        await contract
          .connect(buyer)
          [contractFunc](voucher, usdcTokenAdr, buyer.address)
      ).to.not.be.reverted;

      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);
    });

    it("Should not mint if buyer doesn't approve tokens for payment", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr5;
      // const buyerWallet = address4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 100;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      // Transfer to buyer
      await expect(usdtToken.connect(owner).transfer(buyer, value)).to.not.be
        .reverted;
      expect(await usdtToken.balanceOf(buyer)).to.equal(value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );

      await expect(
        contract
          .connect(buyer)
          [contractFunc](voucher, usdtTokenAdr, buyer.address)
      )
        .to.be.revertedWithCustomError(
          usdtToken,
          errors.erc20InsufficientAllowance
        )
        .withArgs(contractAdr, 0, value);
    });

    it("Should receive tokens on successfully mint", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = owner;
      const buyerWallet = ownerAddress;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 100;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await contract.connect(owner)[addToken](dpTokenAdr);

      await dpToken.connect(owner).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      expect(
        await contract
          .connect(buyer)
          [contractFunc](voucher, dpTokenAdr, buyer.address)
      ).to.not.be.reverted;

      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);

      // Check Balances
      const fee = getFee(price);
      const creatorValue = BigInt(value) - fee;
      expect(await dpToken.balanceOf(contract)).to.equal(fee);
      expect(await dpToken.balanceOf(creator)).to.equal(creatorValue);
    });

    it("Should not mint if buyer doesn't have enough token balance", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr6;
      const buyerWallet = address6;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 100;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      // Transfer to buyer
      await expect(usdtToken.connect(owner).transfer(buyer, value)).to.not.be
        .reverted;
      expect(await usdtToken.balanceOf(buyer)).to.equal(value);

      // Approve Tokens
      await usdtToken.connect(buyer).approve(contractAdr, value);

      // Transfer from buyer to another wallet
      await expect(usdtToken.connect(buyer).transfer(addr7, BigInt(price))).to
        .not.be.reverted;
      expect(await usdtToken.balanceOf(addr7)).to.equal(price);
      const remainingBal = BigInt(value) - BigInt(price);
      expect(await usdtToken.balanceOf(buyer)).to.equal(remainingBal);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      await expect(
        contract
          .connect(buyer)
          [contractFunc](voucher, usdtTokenAdr, buyer.address)
      ).to.be.revertedWithCustomError(
        usdtToken,
        errors.eRC20InsufficientBalance
      );
      // ).to.be.revertedWithCustomError(contract, errors.insufficientBalance);
    });

    it("Should not mint if buyer approves less tokens than the price", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr8;
      const buyerWallet = address8;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 620;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      // Transfer to buyer
      await expect(usdtToken.connect(owner).transfer(buyer, value)).to.not.be
        .reverted;
      expect(await usdtToken.balanceOf(buyer)).to.equal(value);

      // Approve Tokens
      const approvedAmount = BigInt(value) - BigInt(price);
      await usdtToken.connect(buyer).approve(contractAdr, approvedAmount);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      await expect(
        contract
          .connect(buyer)
          [contractFunc](voucher, usdtTokenAdr, buyer.address)
      )
        .to.be.revertedWithCustomError(usdcToken, "ERC20InsufficientAllowance")
        .withArgs(contractAdr, approvedAmount, value);
    });

    it("Should mint for pioneer", async function () {
      const creator = addr11;
      const creatorWallet = address11;
      const buyer = owner;
      const buyerWallet = ownerAddress;
      const validator = addr5;

      // Add Creator as Pioneer
      expect(await contract.connect(addr3).addPioneer(creator)).to.not.be
        .reverted;
      const creatorBalBefore = BigInt(await usdtToken.balanceOf(creator));
      const contractBalBefore = BigInt(await usdtToken.balanceOf(contract));

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 56;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await usdtToken.connect(buyer).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      expect(
        await contract
          .connect(buyer)
          [contractFunc](voucher, usdtTokenAdr, buyer.address)
      ).to.not.be.reverted;

      // Verify Token Purchase
      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);

      // Calculate the balances
      const creatorBalAfter = BigInt(await usdtToken.balanceOf(creator));
      const contractBalAfter = BigInt(await usdtToken.balanceOf(contract));
      const fee = getFee(price, true);
      const creatorAmount = creatorBalBefore + BigInt(value) - fee;
      expect(creatorBalAfter).to.equal(creatorAmount);
      expect(contractBalAfter).to.equal(contractBalBefore + fee);
    });

    it("Should mint for an agency's creator", async function () {
      const creator = addr11;
      const buyer = owner;
      const validator = addr5;

      // Add Agency - 2.5% = 250
      const agency = addr7;
      const agencyFee = 250;
      expect(await contract.connect(addr3).addAgency(address7, agencyFee)).to
        .not.be.reverted;
      expect(await contract.connect(addr3).addCreator(address7, [address11])).to
        .not.be.reverted;

      // Add Creator to Agency
      const creatorBalBefore = BigInt(await usdtToken.balanceOf(address11));
      const contractBalBefore = BigInt(await usdtToken.balanceOf(contractAdr));
      const agencyBalBefore = BigInt(await usdtToken.balanceOf(address7));

      const details = {
        price: 56,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
        tokenAdr: usdtTokenAdr,
      };
      const tokenId = generateTokenId(address11, 1, tokenIndex++);
      const price = 56;
      const value = getMsgValue(price, false);
      const royalty = 100;
      const stealth = false;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await usdtToken.connect(buyer).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, usdtTokenAdr, owner.address);

      expect(tx).to.not.be.reverted;
      // const value = getMsgValue(details.price, false);

      // await usdtToken.connect(buyer).approve(contractAdr, value);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "token",
      //   tokenIndex++
      // );

      // await expect(await tx).to.not.be.reverted;

      // Verify Token Purchase
      expect(await contract.balanceOf(ownerAddress, tokenId)).to.equal(1);

      // Calculate the balances
      const creatorBalAfter = BigInt(await usdtToken.balanceOf(address11));
      const contractBalAfter = BigInt(await usdtToken.balanceOf(contractAdr));
      const agencyBalAfter = BigInt(await usdtToken.balanceOf(address7));
      const platformFeeCalc = getFee(details.price, true);
      const agencyFeeCalc = getAgencyFee(details.price, agencyFee);
      const creatorAmount =
        creatorBalBefore +
        BigInt(value) -
        platformFeeCalc -
        BigInt(2600000000000000000) -
        BigInt(200000000000000000);
      expect(creatorBalAfter).to.equal(creatorAmount);
      expect(contractBalAfter).to.equal(
        contractBalBefore + platformFeeCalc + agencyFeeCalc
      );
      expect(agencyBalAfter).to.equal(agencyBalBefore + agencyFeeCalc);
    });

    it("Should allow minting a token that has started", async function () {
      const creator = addr1;
      const buyer = owner;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();

      const delayBy = 3;
      const start = now + delayBy;

      // const details = {
      //   price: 0.01,
      //   royalty: 100,
      //   quantity: 10,
      //   buyerQty: 1,
      //   start: start,
      //   end: 0,
      //   stealth: false,
      //   sbt: false,
      //   tokenAdr: usdtTokenAdr,
      // };

      await time.increase(delayBy * 2);

      // const value = getMsgValue(details.price, false);
      // await usdtToken.connect(owner).approve(contractAdr, value);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "token",
      //   tokenIndex++
      // );

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 56;
      const value = getMsgValue(price, false);
      const royalty = 100;
      const stealth = false;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await usdtToken.connect(buyer).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, usdtTokenAdr, ownerAddress);

      expect(tx).to.not.be.reverted;
      // await expect(await tx).to.not.be.reverted;
      // await expect(await tx).to.be.revertedWithCustomError(contract, errors.deprecated);

      expect(await contract.balanceOf(ownerAddress, tokenId)).to.equal(1);
    });

    it("Should allow minting a token that has not ended", async function () {
      const creator = addr1;
      const buyer = owner;
      const validator = addr5;
      const now = await time.latest();

      const delayBy = 60;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0, // Add 3 seconds to timer
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: usdtTokenAdr,
      };

      await time.increase(10);

      // const value = getMsgValue(details.price, false);
      // await usdtToken.connect(owner).approve(contractAdr, value);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "token",
      //   tokenIndex++
      // );

      // await expect(await tx).to.not.be.reverted;
      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 56;
      const value = getMsgValue(price, false);
      const royalty = 100;
      const stealth = false;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await usdtToken.connect(buyer).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, usdtTokenAdr, ownerAddress);

      expect(tx).to.not.be.reverted;
      // await expect(await tx).to.not.be.reverted;
      // await expect(await tx).to.be.revertedWithCustomError(contract, errors.deprecated);

      expect(await contract.balanceOf(ownerAddress, tokenId)).to.equal(1);
      // await expect(tx).to.be.revertedWithCustomError(contract, errors.deprecated);
    });

    it("Should not allow minting a token if mint time has not started", async function () {
      const creator = addr1;
      const buyer = owner;
      const validator = addr5;
      const now = await time.latest();

      const delayBy = 60;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: usdtTokenAdr,
      };

      // const value = getMsgValue(details.price, false);

      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "token",
      //   tokenIndex++
      // );
      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 56;
      const value = getMsgValue(price, false);
      const royalty = 100;
      const stealth = false;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await usdtToken.connect(buyer).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const blockTimeStamp = await time.latest();
      await expect(
        contract
          .connect(owner)
          [contractFunc](voucher, usdtTokenAdr, ownerAddress)
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleNotStarted)
        .withArgs(tokenId, start, blockTimeStamp + 1);
    });

    it("Should not allow minting if mint time has ended", async function () {
      const creator = addr1;
      const buyer = owner;
      const validator = addr5;
      const now = await time.latest();

      const delayBy = 10;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: usdtTokenAdr,
      };

      await time.increase(delayBy * 2);
      // const value = getMsgValue(details.price, false);
      // await usdtToken.connect(owner).approve(contractAdr, value);

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 56;
      const value = getMsgValue(price, false);
      const royalty = 100;
      const stealth = false;
      const sbt = false;

      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      await usdtToken.connect(buyer).approve(contractAdr, value);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const blockTimeStamp = await time.latest();
      await expect(
        contract
          .connect(owner)
          [contractFunc](voucher, usdtTokenAdr, ownerAddress)
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
        .withArgs(tokenId, end, blockTimeStamp + 1);
    });
  });

  describe("3.4 Minting Quantities", function () {
    const contractFunc = contractConst.functions.mintApi;

    // it("Should not allow minting a 1of1", async () => {
    //   const creator = addr1;
    //   const buyer = addr2;
    //   const validator = addr5;

    //   let details = {
    //     quantity: 1,
    //     buyerQty: 1,
    //     price: 0.01,
    //     start: 0,
    //     end: 0,
    //     royalty: 100,
    //     stealth: false,
    //     sbt: false,
    //     tokenAdr: null,
    //   };

    //   const tokenId = generateTokenId(address1, 1, tokenIndex++, 1);
    //   const price = 56;
    //   const value = getMsgValue(price, false);
    //   const royalty = 100;
    //   const stealth = false;
    //   const sbt = false;

    //   const values = {
    //     price: value,
    //     tokenId: tokenId,
    //     quantity: 1,
    //     buyerQty: 1,
    //     start: 0,
    //     end: 0,
    //     royalty: royalty,
    //     isStealth: stealth,
    //     isSbt: sbt,
    //   };

    //   await usdtToken.connect(buyer).approve(contractAdr, value);

    //   const voucher = await getSignedVoucher(
    //     contract,
    //     "dpCreations",
    //     values,
    //     creator,
    //     validator
    //   );

    //   await expect(
    //     contract.connect(owner)[contractFunc](voucher, address2)
    //   ).to.be.revertedWithCustomError(contract, "InvalidSender");
    //   // await expect(tx).to.be.revertedWithCustomError(
    //   //   contract,
    //   //   errors.invalidVoucher
    //   // );
    // });

    it("Should not allow buying 0 of a token", async () => {
      const creator = addr2;
      const creatorWallet = address2;
      const buyer = addr4;
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 0,
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

      await expect(
        contract.connect(addr1)[contractFunc](voucher, buyer.address)
      ).to.be.revertedWithCustomError(contract, errors.invalidTokenQty);
    });

    it("Should not mint more than the available supply for a token", async () => {
      const creator = addr1;

      const validator = addr5;

      const details = {
        quantity: 5,
        buyerQty: 1,
        price: 0.01,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };
      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 1;
      const value = getMsgValue(price, false);
      const royalty = 100;
      const stealth = false;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 3,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      await contract.connect(addr1)[contractFunc](voucher, address2);
      await contract.connect(addr1)[contractFunc](voucher, address2);
      await contract.connect(addr1)[contractFunc](voucher, address2);
      await expect(contract.connect(addr1)[contractFunc](voucher, address2))
        .to.be.revertedWithCustomError(contract, errors.invalidTokenQty)
        .withArgs(tokenId, voucher.quantity, 4);
    });

    it("Should not mint if token quantity is wrong for other buyer", async () => {
      const creator = addr2;
      const creatorWallet = address2;
      const buyers = [address4, address11];
      const validator = addr5;

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++); //address2
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 5,
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

      await expect(
        contract.connect(addr1)[contractFunc](voucher, buyers[0])
      ).to.not.be.reverted;
      expect(await contract.tokenMaxQty(tokenId)).to.equal(values.quantity);
      expect(await contract.tokenMintedQty(tokenId)).to.equal(1);
      values.quantity = 6;
      const voucher2 = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      await expect(
        contract.connect(addr1)[contractFunc](voucher2, address11)
      ).to.be.revertedWithCustomError(contract, "MaxTokenQtyExceeded");
    });

    it("Should allow minting upto a token's max quantity", async () => {
      const creator = addr11;
      const buyer = address2;
      const validator = addr5;
      tokenIndex++;

      const details = {
        quantity: 2,
        buyerQty: 1,
        price: 0.01,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      const tokenId = generateTokenId(address11, 1, tokenIndex++);
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
      const voucher2 = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const voucher3 = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      await contract.connect(addr1)[contractFunc](voucher, buyer);
      await contract.connect(addr1)[contractFunc](voucher2, buyer);
      await expect(
        contract.connect(addr1)[contractFunc](voucher2, buyer)
      ).to.be.revertedWithCustomError(contract, errors.invalidTokenQty);
    });

    it("Should allow minting a token until it expires", async () => {
      const creator = addr11;
      const buyer = address10;
      const validator = addr5;

      const now = await time.latest();

      start = now - 1;
      end = now + 60;

      const details = {
        quantity: 10,
        buyerQty: 1,
        price: 0.01,
        start: start,
        end: end,
        royalty: 100,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };
      const tokenId = generateTokenId(address11, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 2,
        buyerQty: 1,
        start: start,
        end: end,
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

      for (let i = 0; i < 6; i++) {
        await time.increase(10);
      }

      const finalTime = await time.latest();
      await expect(contract.connect(addr1)[contractFunc](voucher, buyer))
        .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
        .withArgs(tokenId, details.end, finalTime + 1);
    });
  });

  describe("3.5 Gasless Minting", async () => {
    const contractFunc =
      constants.contracts.dappunkCreations.functions.mintNftGasless;

    let details = {
      quantity: 10,
      buyerQty: 1,
      price: 0.01,
      start: 0,
      end: 0,
      royalty: 100,
      stealth: false,
      sbt: false,
      tokenAdr: null,
    };

    it("Should mint NFT successfully with native token", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;
      
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0.02, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0.02"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      // checking for the role of Relayer
      expect(await contract.hasRole(roles.RELAYER_ROLE, ownerAddress));

      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, address4, options);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(buyerWallet, voucher.tokenId)).to.equal(
        1
      );
    });
    it("Should revert if the improper amount was sent by the relayer", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0.02, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0.02"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: ethers.parseEther("0.01") };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );

      // checking for the role of Relayer
      expect(await contract.hasRole(roles.RELAYER_ROLE, ownerAddress));

      await expect(
        contract.connect(owner)[contractFunc](voucher, address4, options)
      ).to.be.revertedWithCustomError(contract, errors.insufficientBalance);
    });
    it("Should not mint if 0 value is passed", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);    
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0.02, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0.02"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      await expect(
        contract.connect(owner)[contractFunc](voucher, address4, { value: 0 })
      ).to.be.revertedWithCustomError(contract, errors.insufficientBalance);
    });

    it("Should not mint if price is set to 0", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;
     await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const value = getMsgValue(0, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.parseEther("0"),
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      // const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      // console.log(voucher);
      await expect(contract.connect(owner)[contractFunc](voucher, address4))
        .to.be.revertedWithCustomError(contract, errors.invalidPrice)
        .withArgs(tokenId, 0);
    });

    it("Should receive funds on successful mint", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr5;
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };
      const balanceBefore = await ethers.provider.getBalance(contractAdr);

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      expect(
        await contract
          .connect(owner)
          [contractFunc](voucher, buyer.address, options)
      ).to.not.be.reverted;

      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);

      const balance = await ethers.provider.getBalance(contractAdr);
      expect(balance).to.equal(balanceBefore + getFee(price));
    });

    it("Should not mint when tokenId doesn't match creator", async function () {
      // const creator = addr1;
      const creatorWallet = address1;
      const buyerWallet = address4;
      const wrongSigner = addr2;
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
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
        wrongSigner,
        owner
      );

      await expect(
        contract.connect(owner)[contractFunc](voucher, owner.address)
      )
        .to.be.revertedWithCustomError(contract, "InvalidCreator")
        .withArgs(wrongSigner);
    });

    it("Should not mint when voucher is not correct", async function () {
      const chainId = constants.chainId;

      const creator = addr2;
      const creatorWallet = address2;
      const buyer = addr5;
      const validator = addr5;
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = false;
      const sbt = false;

      const royaltyVal = royalty * royaltyMultiplier;
      let voucher = {
        tokenId,
        price: ethers.toBigInt(value),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royaltyVal,
        isStealth: stealth,
        isSbt: sbt,
      };

      const domain = {
        name: "randomString",
        version: contractConst.domain.version,
        verifyingContract: contractAdr,
        chainId: chainId,
      };

      const creatorSign = await creator.signTypedData(domain, types, voucher);
      const validatorSign = await validator.signTypedData(
        domain,
        types,
        voucher
      );
      voucher = { ...voucher, creator: creatorSign, validator: validatorSign };

      const options = { value: value };
      await expect(
        contract.connect(owner)[contractFunc](voucher, buyer.address, options)
      ).to.be.reverted;
    });

    it("Should not mint when signed by unauthorized validator", async function () {
      const creator = addr1;
      const creatorWallet = address1;
      const buyer = addr4;
      const buyerWallet = address4;
      const validator = addr3;
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      await expect(
        contract.connect(owner)[contractFunc](voucher, buyer.address, options)
      )
        .to.be.revertedWithCustomError(contract, "InvalidValidator");
    });

    it("Should mint for pioneer", async function () {
      const creator = addr10;
      const creatorWallet = address10;
      const buyer = addr5;
      const buyerWallet = address5;
      const validator = addr5;
       await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);     
      // Add Creator as Pioneer
      expect(await contract.connect(addr3).addPioneer(creator)).to.not.be
        .reverted;
      const creatorBalBefore = BigInt(
        await ethers.provider.getBalance(creator)
      );
      const contractBalBefore = BigInt(
        await ethers.provider.getBalance(contract)
      );

      const tokenId = generateTokenId(creatorWallet, 1, tokenIndex++);
      const price = 0.02;
      const value = getMsgValue(price, false);
      const royalty = 10;
      const stealth = true;
      const sbt = false;

      const values = {
        price: ethers.toBigInt(value),
        tokenId: ethers.toBigInt(tokenId),
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: royalty,
        isStealth: stealth,
        isSbt: sbt,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      expect(
        await contract
          .connect(owner)
          [contractFunc](voucher, buyer.address, options)
      ).to.not.be.reverted;

      // Verify Token Purchase
      expect(await contract.balanceOf(buyerWallet, tokenId)).to.equal(1);

      // Calculate the balances
      const creatorBalAfter = BigInt(await ethers.provider.getBalance(creator));
      const contractBalAfter = BigInt(
        await ethers.provider.getBalance(contract)
      );
      const fee = getFee(price, true);
      const creatorAmount = creatorBalBefore + BigInt(value) - fee;
      expect(creatorBalAfter).to.equal(creatorAmount);
      expect(contractBalAfter).to.equal(contractBalBefore + fee);
    });

    it("Should mint for an agency's creator", async function () {
      const creator = addr10;
      const buyer = addr5;
      const validator = addr5;
        await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      // Add Agency - 2.5% = 250
      const agency = addr6;
      const agencyFee = 250;
      expect(await contract.connect(addr3).addAgency(address6, agencyFee)).to
        .not.be.reverted;
      expect(await contract.connect(addr3).addCreator(address6, [address10])).to
        .not.be.reverted;

      // Add Creator to Agency
      const creatorBalBefore = BigInt(
        await ethers.provider.getBalance(address10)
      );
      const contractBalBefore = BigInt(
        await ethers.provider.getBalance(contractAdr)
      );
      const agencyBalBefore = BigInt(
        await ethers.provider.getBalance(address6)
      );

      const details = {
        price: 0.02,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        stealth: false,
        sbt: false,
      };

      const value = getMsgValue(details.price, false);

      const tokenId = generateTokenId(address10, 1, tokenIndex++);
      const values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: false,
        isSbt: false,
      };

      const options = { value: value };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        validator
      );
      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, buyer.address, options);
      await expect(tx).to.not.be.reverted;

      // Verify Token Purchase
      expect(await contract.balanceOf(address5, tokenId)).to.equal(1);

      // Calculate the balances
      const creatorBalAfter = BigInt(
        await ethers.provider.getBalance(address10)
      );
      const contractBalAfter = BigInt(
        await ethers.provider.getBalance(contractAdr)
      );
      const agencyBalAfter = BigInt(await ethers.provider.getBalance(address6));
      const platformFeeCalc = getFee(details.price, true);
      const agencyFeeCalc = getAgencyFee(details.price, agencyFee);
      // const fee = platformFeeCalc + agencyFeeCalc;
      const creatorAmount =
        creatorBalBefore +
        BigInt(value) -
        platformFeeCalc -
        BigInt(1000000000000000);
      expect(creatorBalAfter).to.equal(creatorAmount);
      expect(contractBalAfter).to.equal(
        contractBalBefore + platformFeeCalc + agencyFeeCalc
      );
      expect(agencyBalAfter).to.equal(agencyBalBefore + agencyFeeCalc);
    });

    it("Should allow minting a token that has started", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const delayBy = 3;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(delayBy * 2);

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: start,
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
        addr5
      );
      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, address2, { value: value });
      await expect(tx).to.not.be.reverted;
      // await expect(await tx).to.be.revertedWithCustomError(contract, errors.deprecated);

      expect(await contract.balanceOf(address2, tokenId)).to.equal(1);
    });

    it("Should allow minting a token that has not ended", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;

      const now = await time.latest();
        await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const delayBy = 60;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0, // Add 3 seconds to timer
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(10);
      // console.log("block: ", await time.latest());

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );
      const tx = await contract
        .connect(owner)
        [contractFunc](voucher, address2, { value: value });
      await expect(tx).to.not.be.reverted;
      // await expect(await tx).to.be.revertedWithCustomError(contract, errors.deprecated);

      expect(await contract.balanceOf(address2, tokenId)).to.equal(1);
    });

    it("Should not allow minting a token if mint time has not started", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const delayBy = 60;
      const start = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: start,
        end: 0,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: start,
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
        addr5
      );

      const blockTimeStamp = await time.latest();

      await expect(
        contract
          .connect(owner)
          [contractFunc](voucher, address2, { value: value })
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleNotStarted)
        .withArgs(tokenId, start, blockTimeStamp + 1);
    });

    it("Should not allow minting if mint time has ended", async function () {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // const now = getNow();
      const now = await time.latest();
      await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
      const delayBy = 10;
      const end = now + delayBy;

      const details = {
        price: 0.01,
        royalty: 100,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        stealth: false,
        sbt: false,
        tokenAdr: null,
      };

      await time.increase(delayBy * 2);

      const tokenId = generateTokenId(address1, 1, tokenIndex++);
      const price = 0.01;
      const value = getMsgValue(price, false);
      const royalty = 10;

      let values = {
        price: value,
        tokenId: tokenId,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: end,
        royalty: royalty,
        isStealth: false,
        isSbt: false,
      };

      const voucher = await getSignedVoucher(
        contract,
        "dpCreations",
        values,
        creator,
        addr5
      );

      const blockTimeStamp = await time.latest();

      await expect(
        contract
          .connect(owner)
          [contractFunc](voucher, address2, { value: value })
      )
        .to.be.revertedWithCustomError(contract, errors.tokenSaleEnded)
        .withArgs(tokenId, end, blockTimeStamp + 1);
    });
  });
});
