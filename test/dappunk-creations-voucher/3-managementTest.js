const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./../../utils/constants");
const {
  getFee,
  getMsgValue,
  generateTokenId,
  getSignedVoucher,
} = require("./../../utils/voucherGen");
const { BigNumber } = require("bignumber.js");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { any } = require("hardhat/internal/core/params/argumentTypes");

const contractConst = constants.contracts.dappunkCreations;
const contractPath = contractConst.file;
const tokenAddress = constants.tokenAddress;
const tokenAddress2 = constants.tokenAddress2;

// Basic info
const name = contractConst.name;
const symbol = contractConst.symbol;
const errors = constants.errors;
const baseUri = constants.baseUri;
const defaultValues = contractConst.defaultValues;
const roles = constants.roles;
const interfaceId = constants.interfaceId;
const priceMultiplier = constants.priceMultiplier;
let logicFactory, logicContract, logicAddress;

let tokenIndex = 200;

it.todo = function (title, callback) {
  return it.skip("TODO: " + title, callback);
};

describe("2. Managing Agency, Pioneer and Supported Contracts", function () {
  let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9;
  let addr10, addr11, addr12, addr13, addr14;
  let contractAdr, contract, ownerAddress;
  let address1,
    address2,
    address3,
    address4,
    address5,
    address6,
    address7,
    address8,
    address9;
  let address10, address11, address12, address13, address14;

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
      addr12,
      addr13,
      addr14,
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
    address12 = addr12.address;
    address13 = addr13.address;
    address14 = addr14.address;

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

  describe("2.1 Agencies", function () {
    it("Should prevent unauthorized wallet from adding an agency", async () => {
      await expect(contract.connect(addr9).addAgency(address9, 9))
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow AgencyManager to add an agency wallet", async () => {
      expect(await contract.connect(addr3).addAgency(address9, 9)).to.not.be
        .reverted;
      const agencyPercent = await contract.agencyFee(address9);
      expect(agencyPercent).to.equal(9);
    });

    it("Should allow AGENCY_MANAGER_ROLE to add multiple agency wallets", async () => {
      await contract.connect(owner).grantRole(roles.AGENCY_MANAGER_ROLE, owner);
      expect(await contract.connect(owner).addAgency(address5, 15)).to.not.be
        .reverted;
      expect(await contract.connect(owner).addAgency(address6, 20)).to.not.be
        .reverted;
      expect(await contract.connect(owner).addAgency(address7, 25)).to.not.be
        .reverted;
      expect(await contract.agencyFee(address5)).to.equal(15);
      expect(await contract.agencyFee(address6)).to.equal(20);
      expect(await contract.agencyFee(address7)).to.equal(25);
    });


    it("Should prevent adding an agency again", async () => {
      expect(await contract.connect(addr3).addAgency(address10, 10)).to.not.be
        .reverted;
      await expect(contract.connect(addr3).addAgency(address10, 10))
        .to.be.revertedWithCustomError(contract, errors.alreadyAdded)
        .withArgs(address10);
    });
  });

  describe("2.2 Creators for Agencies", function () {
    it("Should prevent unauthorised wallet from adding a creator to an agency", async () => {
      const creators = [address1, address2];
      await expect(contract.connect(addr9).addCreator(address9, creators))
        .revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow AGENCY_MANAGER_ROLE to add creators to an agency", async () => {
      await contract.connect(owner).grantRole(roles.AGENCY_MANAGER_ROLE, owner);
      const creators = [address10, address11];
      expect(await contract.connect(owner).addCreator(address9, creators)).to
        .not.be.reverted;

      expect(await contract.agencyCreator(creators[0])).to.equal(address9);
      expect(await contract.agencyCreator(creators[1])).to.equal(address9);
    });

    it("Should not allow adding same creator to an agency again", async () => {
      const creators = [address1, address2];
      await contract
        .connect(owner)
        .grantRole(roles.AGENCY_MANAGER_ROLE, addr4.address);
      await expect(contract.connect(addr4).addCreator(address9, creators)).to
        .not.be.reverted;

      expect(await contract.agencyCreator(creators[0])).to.equal(address9);
      expect(await contract.agencyCreator(creators[1])).to.equal(address9);
      await expect(contract.connect(addr4).addCreator(address9, [creators[0]]))
        .to.be.revertedWithCustomError(contract, errors.alreadyAdded)
        .withArgs(creators[0]);
    });
  });

  describe("2.3 Pioneer", () => {
    it("Should prevent unauthorised wallet from adding a pioneer", async () => {
      await expect(contract.connect(addr9).addPioneer(address9))
        .revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    // it("Should allow DefaultAdmin to add a pioneer", async () => {
    //   expect(await contract.connect(owner).addPioneer(address9)).to.not.be
    //     .reverted;

    //   expect(await contract.pioneers(address9)).to.equal(true);
    // });

    // it("Should allow Manager to add a pioneer", async () => {
    //   expect(await contract.connect(addr1).addPioneer(address9)).to.not.be
    //     .reverted;

    //   expect(await contract.pioneers(address9)).to.equal(true);
    // });

    it("Should allow AgencyManager to add a pioneer", async () => {
      await contract
        .connect(owner)
        .grantRole(roles.AGENCY_MANAGER_ROLE, address4);
      expect(await contract.connect(addr4).addPioneer(address9)).to.not.be
        .reverted;

      expect(await contract.pioneers(address9)).to.equal(true);
    });

    it("Should not allow adding a pioneer more than once", async () => {
      const pioneer = address9;
      await contract
        .connect(owner)
        .grantRole(roles.AGENCY_MANAGER_ROLE, address4);
      expect(await contract.connect(addr4).addPioneer(pioneer)).to.not.be
        .reverted;
      expect(await contract.pioneers(pioneer)).to.equal(true);

      await expect(contract.connect(addr4).addPioneer(pioneer))
        .revertedWithCustomError(contract, errors.alreadyAdded)
        .withArgs(pioneer);
    });
  });

  describe("2.4 Supported Contracts", () => {
    describe("2.4.1 Add  pre-approved contract", () => {
      it("Should prevent unauthorized wallet from adding a pre-approved", async () => {
        await expect(contract.connect(addr6).setApprovedContract(address9))
          .revertedWithCustomError(contract, errors.acUnauthorized)
          .withArgs(anyValue, anyValue);
      });

      it("Should prevent adding a contract twice", async () => {
        await contract
          .connect(owner)
          .grantRole(roles.CONTRACT_APPROVER_ROLE, address6);
        await contract.connect(addr6).setApprovedContract(address9);
        await expect(contract.connect(addr6).setApprovedContract(address9))
          .to.be.revertedWithCustomError(contract, errors.alreadyAdded)
          .withArgs(address9);
      });

      it("Should allow Manager to add a pre-approved contract", async () => {
        await contract
          .connect(owner)
          .grantRole(roles.CONTRACT_APPROVER_ROLE, address1);
        expect(await contract.connect(addr1).setApprovedContract(address9)).to
          .not.be.reverted;

        expect(await contract.approvedContracts(address9)).to.equal(true);
        expect(await contract.isApprovedForAll(addr1, address9)).to.equal(true);
      });

      it("Should allow ContractManager to add multiple pre-approved contracts", async () => {
        await contract
          .connect(owner)
          .grantRole(roles.CONTRACT_APPROVER_ROLE, address6);
        await contract.connect(addr6).setApprovedContract(address5);
        await contract.connect(addr6).setApprovedContract(address6);
        await contract.connect(addr6).setApprovedContract(address7);
        await contract.connect(addr6).setApprovedContract(address8);
        await contract.connect(addr6).setApprovedContract(address9);

        expect(await contract.approvedContracts(address5)).to.equal(true);
        expect(await contract.approvedContracts(address6)).to.equal(true);
        expect(await contract.approvedContracts(address7)).to.equal(true);
        expect(await contract.approvedContracts(address8)).to.equal(true);
        expect(await contract.approvedContracts(address9)).to.equal(true);
        expect(await contract.isApprovedForAll(addr1, address5)).to.equal(true);
        expect(await contract.isApprovedForAll(addr1, address6)).to.equal(true);
        expect(await contract.isApprovedForAll(addr1, address7)).to.equal(true);
        expect(await contract.isApprovedForAll(addr1, address8)).to.equal(true);
        expect(await contract.isApprovedForAll(addr1, address9)).to.equal(true);
      });

      it("Should confirm unapproved contract", async () => {
        expect(await contract.isApprovedForAll(addr1, address11)).to.equal(
          false
        );
        expect(await contract.approvedContracts(address11)).to.equal(false);
      });
    });

    describe("2.4.2 Remove pre-approved contract", () => {
      it("Should prevent unauthorised wallet from removing a pre-approved contract", async () => {
        await contract.connect(addr4).setApprovedContract(address9);

        await expect(contract.connect(addr5).removeApprovedContract(address9))
          .revertedWithCustomError(contract, errors.acUnauthorized)
          .withArgs(anyValue, anyValue);
      });

      it("Should prevent removing a non existing pre-approved contract", async () => {
        await expect(contract.connect(addr4).removeApprovedContract(address8))
          .to.be.revertedWithCustomError(contract, errors.notSupported)
          .withArgs(address8);
      });

      it("Should allow ContractManager to remove a pre-approved contract", async () => {
        await contract.connect(addr4).setApprovedContract(address7);
        await contract.connect(addr4).removeApprovedContract(address7);

        expect(await contract.approvedContracts(address7)).to.equal(false);
      });

      it("Should allow ContractManager to remove multiple pre-approved contracts", async () => {
        // First add the contracts
        await contract.connect(addr4).setApprovedContract(address9);
        expect(await contract.approvedContracts(address9)).to.equal(true);
        await contract.connect(addr4).setApprovedContract(address8);
        expect(await contract.approvedContracts(address8)).to.equal(true);
        await contract.connect(addr4).setApprovedContract(address7);
        expect(await contract.approvedContracts(address7)).to.equal(true);
        await contract.connect(addr4).setApprovedContract(address6);
        expect(await contract.approvedContracts(address6)).to.equal(true);
        await contract.connect(addr4).setApprovedContract(address2);
        expect(await contract.approvedContracts(address2)).to.equal(true);

        // Remove the contracts
        await contract.connect(addr4).removeApprovedContract(address9);
        await contract.connect(addr4).removeApprovedContract(address8);
        await contract.connect(addr4).removeApprovedContract(address7);
        await contract.connect(addr4).removeApprovedContract(address6);
        await contract.connect(addr4).removeApprovedContract(address2);
        expect(await contract.approvedContracts(address9)).to.equal(false);
        expect(await contract.approvedContracts(address8)).to.equal(false);
        expect(await contract.approvedContracts(address7)).to.equal(false);
        expect(await contract.approvedContracts(address6)).to.equal(false);
        expect(await contract.approvedContracts(address2)).to.equal(false);
      });
    });
  });

  describe("2.5 Deprecate Contract", () => {
    it("Should confirm contract is not deprecated", async () => {
      expect(await contract.isDeprecated()).to.equal(false);
    });

    it("Should not allow non DefaultAdmin or Manager to deprecate contract", async () => {
      await expect(
        contract.connect(addr2).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr3).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr4).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr5).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr6).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr7).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr8).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      expect(await contract.isDeprecated()).to.equal(false);
    });

    it("Should not allow non DefaultAdmin to revive contract", async () => {
      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;
      expect(await contract.isDeprecated()).to.equal(true);

      await expect(
        contract.connect(addr2).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr3).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr4).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr5).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr6).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr7).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      await expect(
        contract.connect(addr8).reviveContract()
      ).to.be.revertedWithCustomError(contract, errors.acUnauthorized);

      expect(await contract.isDeprecated()).to.equal(true);
    });

    it("Should allow DefaultAdmin to deprecate contract", async () => {
      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;
      expect(await contract.isDeprecated()).to.equal(true);
    });

    it("Should allow deprecating contract if already deprecated", async () => {
      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;
      expect(await contract.isDeprecated()).to.equal(true);
      await expect(
        contract.connect(owner).deprecate()
      ).to.be.revertedWithCustomError(contract, errors.deprecated);
    });

    it("Should allow DefaultAdmin to revive contract", async () => {
      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;
      expect(await contract.isDeprecated()).to.equal(true);
      expect(await contract.connect(owner).reviveContract()).to.not.be.reverted;
      expect(await contract.isDeprecated()).to.equal(false);
    });

    // Defining common values
    let details = {
      price: 10,
      royalty: 100,
      quantity: 10,
      buyerQty: 1,
      start: 0,
      end: 0,
      stealth: false,
      sbt: false,
      tokenAdr: null,
    };

    it("Should not allow Mint with API if contract deprecated", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;

      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;
      
    
      const tkId = generateTokenId(address1, 1, 1);
      
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther("1"),
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
        addr1,
        addr5
      );
    //   console.log(vr);

     
      await expect(
        contract
          .connect(addr1)
          [
            "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](vr, address2)
      ).to.be.revertedWithCustomError(contract, errors.deprecated);
    });

    it("Should not allow Mint with Native if contract deprecated", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      // First Deprecate contract
      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;

      const tkId = generateTokenId(address1, 1, 1);
      
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: ethers.parseEther("1"),
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
        addr1,
        addr5
      );
    //   console.log(vr);
     
      await expect(
        contract
          .connect(buyer)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](vr, buyer.address, { value: vr.price })
      ).to.be.revertedWithCustomError(contract, errors.deprecated);
    });

    it("Should not allow Mint with Token if contract deprecated", async () => {
      // First Deprecate contract
      expect(await contract.connect(owner).deprecate()).to.not.be.reverted;

      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
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
      details.tokenAdr = address14;
      // const details = {
      //   price: 10,
      //   royalty: 100,
      //   start: 0,
      //   end: 0,
      //   stealth: false,
      //   sbt: false,
      //   tokenAdr: address14,
      // };

      // const { tx } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "token",
      //   tokenIndex++
      // );

      // await expect(tx).to.be.revertedWithCustomError(
      //   contract,
      //   errors.deprecated
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
      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        addr1,
        addr5
      );
      await expect(
        contract
          .connect(buyer)
          [
            "mintNftWithToken((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address,address)"
          ](vr, address14, buyer.address)
      ).to.be.revertedWithCustomError(contract, errors.deprecated);
    });
  });
});
