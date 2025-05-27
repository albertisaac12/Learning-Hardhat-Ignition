const { expect } = require("chai");
const { ethers } = require("hardhat");
const constants = require("./../../utils/constants");
// const { mint1155 } = require("./../../utils/mint");
const {
  getFee,
  getMsgValue,
  generateTokenId,
  getSignedVoucher,
} = require("./../../utils/voucherGen");
const { BigNumber } = require("bignumber.js");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

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
let tokenIndex = 1;
let logicFactory, logicContract, logicAddress;

it.todo = function (title, callback) {
  return it.skip("TODO: " + title, callback);
};

describe("\n### dappunk 1155 Minting Contract ###\n\n1. Deploy dappunk1155.sol", function () {
  let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9;
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

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9] =
      await ethers.getSigners();
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

    logicFactory = await ethers.getContractFactory(
      "contracts/Forwarder/forewarder.sol:logic"
    );
    logicContract = await logicFactory.connect(owner).deploy("meow");
    await logicContract.waitForDeployment();
    logicAddress = await logicContract.getAddress();

    const contractFactory = await ethers.getContractFactory(contractPath);
    // contract = await contractFactory.deploy();
    contract = await contractFactory.connect(owner).deploy(
      ownerAddress, // manager
      address1, // minter
      address2, // fundManager
      address3, // agency
      address4, // contractApprover
      address5, // mintValidator
      address6, // refundManager
      logicAddress, // forwarder
    );
    await contract.waitForDeployment();
    contractAdr = await contract.getAddress();
  });

  describe("1.1. Check basic info", function () {
    it("Should deploy with correct name", async () => {
      expect(await contract.name()).to.equal(name);
    });

    it("Should deploy with correct symbol", async () => {
      expect(await contract.symbol()).to.equal(symbol);
    });

    it("Should support EIP165", async () => {
      expect(await contract.supportsInterface(interfaceId.ERC165)).to.equal(
        true
      );
    });

    it("Should support ERC1155", async () => {
      expect(await contract.supportsInterface(interfaceId.ERC1155)).to.equal(
        true
      );
    });

    it("Should support ERC2981 - Royalty Standard", async () => {
      expect(await contract.supportsInterface(interfaceId.ERC2981)).to.equal(
        true
      );
    });

    it("Should support AccessControl", async () => {
      expect(
        await contract.supportsInterface(interfaceId.AccessControl)
      ).to.equal(true);
    });

    it("Should NOT support ERC721", async () => {
      expect(await contract.supportsInterface(interfaceId.ERC721)).to.equal(
        false
      );
    });

    it("Should NOT support ERC20", async () => {
      expect(await contract.supportsInterface(interfaceId.ERC20)).to.equal(
        false
      );
    });

    it("Should deploy with correct domain information", async () => {
      const domainInfo = await contract.eip712Domain();
      const domain = contractConst.domain;
      expect(domainInfo.name).to.equal(domain.domain);
      expect(domainInfo.version).to.equal(domain.version);
      expect(domainInfo.chainId).to.equal(constants.chainId);
      expect(domainInfo.verifyingContract).to.equal(contractAdr);
      expect(domainInfo.salt).to.equal(constants.zero);
    });

    it("Should deploy with correct roles", async () => {
      expect(await contract.hasRole(roles.DEFAULT_ADMIN_ROLE, ownerAddress)).to.equal(
        true
      );
      expect(await contract.hasRole(roles.MANAGER_ROLE,ownerAddress)).to.equal(true);
      expect(await contract.hasRole(roles.MINTER_ROLE, address1)).to.equal(true);
      expect(await contract.hasRole(roles.MINTER_ROLE, logicAddress)).to.equal(true);
      expect(await contract.hasRole(roles.FUND_MANAGER_ROLE, address2)).to.equal(
        true
      );
      expect(await contract.hasRole(roles.AGENCY_MANAGER_ROLE, address3)).to.equal(
        true
      );
    //   expect(
    //     await contract.hasRole(roles.ROYALTY_MANAGER_ROLE, addr4.address)
    //   ).to.equal(true);
      expect(
        await contract.hasRole(roles.CONTRACT_APPROVER_ROLE, address4)
      ).to.equal(true);
      expect(await contract.hasRole(roles.MINT_VALIDATOR_ROLE, address5)).to.equal(
        true
      );
      expect(await contract.hasRole(roles.REFUND_MANAGER_ROLE, address6)).to.equal(
        true
      );
    });

    it("Should deploy with correct default values", async () => {
      expect(await contract.baseUri()).to.equal(baseUri);
      expect(await contract.stealthUri()).to.equal(defaultValues.stealthUrl);
      expect(await contract.platformFee()).to.equal(defaultValues.platformFee);
      expect(await contract.pioneerFee()).to.equal(defaultValues.pioneerFee);
      expect(await contract.uriSuffixEnabled()).to.equal(false);
      expect(await contract.uriSuffix()).to.equal("");
    });
  });

  describe("1.2. Update Uri", function () {
    it("Should prevent unauthorised user from updating the baseUri", async function () {
      await expect(
        contract.connect(addr9).updateBaseUri("https://www.baseURI.com")
      )
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow owner to update baseUri", async function () {
      await contract.connect(owner).updateBaseUri("https://www.baseURI.com");
      expect(await contract.baseUri()).to.equal("https://www.baseURI.com");
    });

    it("Should prevent unauthorised user from updating the stealthUri", async function () {
      await expect(
        contract.connect(addr9).updateStealthUri("https://www.stealthURI.com")
      )
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow owner to update stealthUri", async function () {
      await contract
        .connect(owner)
        .updateStealthUri("https://www.stealthURI.com");
      expect(await contract.stealthUri()).to.equal(
        "https://www.stealthURI.com"
      );
    });

    it("Should allow owner to update uriSuffix", async () => {
      await contract.connect(owner).updateUriSuffix(".json");
      expect(await contract.uriSuffix()).to.equal(".json");
    });

    it("Should prevent unauthorised user from enabling uriSuffix", async () => {
      await expect(contract.connect(addr9).toggleUriSuffix())
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow owner to enable uriSuffix", async () => {
      await contract.connect(owner).toggleUriSuffix();
      expect(await contract.uriSuffixEnabled()).to.equal(true);
    });

    it("Should prevent unauthorised user from updating the uriSuffix", async () => {
      await expect(contract.connect(addr9).updateUriSuffix(".png"))
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should return correct URI without suffix", async () => {
      const creator = address1;
      const buyer = address2;
      const validator = addr5;
      const minter = addr1;
      
      expect(await contract.hasRole(roles.MINTER_ROLE, minter.address)).to.be.true;
      expect(
        await contract.hasRole(roles.MINT_VALIDATOR_ROLE, validator.address)
      ).to.equal(true);

      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: 1,
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
        "1155",
        valuess,
        addr1,
        addr5
      );
      
      const tx = await contract
        .connect(minter)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address2, valuess.tokenId)).to.equal(1);
      const base = await contract.baseUri();
      // console.log(base);
      const urir = await contract.uri(vr.tokenId);
      // console.log("need help: ", urir);
      const expectedUri = baseUri + vr.tokenId.toString();
      // console.log(expectedUri);
      expect(urir).to.equal(expectedUri);
    });

    it("Should return correct URI with suffix", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      const minter = addr1;
      const suffix = ".json";

      expect(await contract.hasRole(roles.MINTER_ROLE, minter.address)).to.equal(
        true
      );
      expect(
        await contract.hasRole(roles.MINT_VALIDATOR_ROLE, validator.address)
      ).to.equal(true);
      // expect(await contract.uriSuffixEnabled).to.equal(false);
      expect(await contract.connect(owner).toggleUriSuffix()).to.not.be
        .reverted;
      expect(await contract.uriSuffixEnabled()).to.equal(true);
      expect(await contract.connect(owner).updateUriSuffix(suffix)).to.not.be
        .reverted;
      expect(await contract.uriSuffix()).to.equal(suffix);

     
      const tkId = generateTokenId(address1, 1, 1);
      // console.log("The tokenID is: ", tkId);
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: 1,
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

      const tx = await contract
        .connect(minter)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);

      const expectedUri = baseUri + vr.tokenId.toString() + suffix;
      // console.log(expectedUri);
      expect(await contract.uri(vr.tokenId)).to.equal(expectedUri);
    });

    it("Should return blank if no baseUri is set", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      const minter = addr1;

      await contract.connect(owner).updateBaseUri("");

      const tkId = generateTokenId(address1, 1, 1);
  
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: 1,
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

      const tx = await contract
        .connect(minter)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);

      expect(await contract.uri(vr.tokenId)).to.equal("");
    });

    it("Should return blank if no baseUri is set even with suffix", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;
      const suffix = ".json";

  

      expect(await contract.hasRole(roles.MINTER_ROLE, address1)).to.equal(
        true
      );
      expect(
        await contract.hasRole(roles.MINT_VALIDATOR_ROLE, validator.address)
      ).to.equal(true);
      expect(await contract.connect(owner).toggleUriSuffix()).to.not.be
        .reverted;
      expect(await contract.uriSuffixEnabled()).to.equal(true);
      expect(await contract.connect(owner).updateUriSuffix(suffix)).to.not.be
        .reverted;
      expect(await contract.uriSuffix()).to.equal(suffix);
      await expect(await contract.connect(owner).updateBaseUri("")).to.not.be
        .reverted;

     
      const tkId = generateTokenId(address1, 1, 1);

      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: 1,
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
      // console.log(vr);
      // const { tx, tokenId } = await mint1155(
      //   contract,
      //   creator,
      //   buyer,
      //   validator,
      //   details,
      //   "api",
      //   1
      // );
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);

      expect(await contract.uri(vr.tokenId)).to.equal("");
    });

    it("Should return blank if no stealthUri is set", async () => {
      const creator = addr1;
      const buyer = addr2;
      const validator = addr5;

      await expect(await contract.connect(owner).updateStealthUri("")).to.not.be
        .reverted;

    
      const tkId = generateTokenId(address1, 1, 1);
   
      const valuess = {
        tokenId: ethers.toBigInt(tkId),
        price: 1,
        quantity: 10,
        buyerQty: 1,
        start: 0,
        end: 0,
        royalty: 100,
        isStealth: true,
        isSbt: false,
      };

      const vr = await getSignedVoucher(
        contract,
        "dpCreations",
        valuess,
        addr1,
        addr5
      );
     
      const tx = await contract
        .connect(addr1)
        [
          "mintNft((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
        ](vr, address2);
      expect(tx).to.not.be.reverted;
      expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);

      expect(await contract.uri(vr.tokenId)).to.equal("");
    });
  });

  describe("1.3. ERC20 Token Support ", function () {
    it("Should prevent unauthorised user from adding a Token", async function () {
      await expect(contract.connect(addr9).addSupportedToken(tokenAddress))
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow owner to add a Token", async function () {
      await contract.connect(owner).addSupportedToken(tokenAddress);
      expect(await contract.supportedTokens(tokenAddress)).to.equal(true);
    });

    it("Should not allow a token from being added again", async () => {
      expect(await contract.connect(owner).addSupportedToken(tokenAddress)).to
        .not.be.reverted;
      expect(await contract.supportedTokens(tokenAddress)).to.equal(true);
      await expect(contract.connect(owner).addSupportedToken(tokenAddress))
        .to.be.revertedWithCustomError(contract, errors.alreadyAdded)
        .withArgs(tokenAddress);
    });

    it("Should prevent unauthorised user from removing a Token", async function () {
      await contract.connect(owner).addSupportedToken(tokenAddress);
      await expect(contract.connect(addr9).removeSupportedToken(tokenAddress))
        .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
        .withArgs(anyValue, anyValue);
    });

    it("Should allow owner to remove a Token", async () => {
      await contract.connect(owner).addSupportedToken(tokenAddress);
      await contract.connect(owner).removeSupportedToken(tokenAddress);
      expect(await contract.supportedTokens(tokenAddress)).to.equal(false);
    });

    it("Should revert if owner try to remove unsupported token", async () => {
      await expect(contract.connect(owner).removeSupportedToken(tokenAddress))
        .to.be.revertedWithCustomError(contract, errors.notSupported)
        .withArgs(tokenAddress);
    });

    it("Should allow authorised user add another supported token", async function () {
      await contract.connect(owner).addSupportedToken(tokenAddress);
      expect(await contract.supportedTokens(tokenAddress)).to.equal(true);

      await contract.connect(owner).addSupportedToken(tokenAddress2);
      expect(await contract.supportedTokens(tokenAddress2)).to.equal(true);
    });

    it("Should allow admin wallet to remove second supported token", async function () {
      await contract.connect(owner).addSupportedToken(tokenAddress);
      expect(await contract.supportedTokens(tokenAddress)).to.equal(true);

      await contract.connect(owner).addSupportedToken(tokenAddress2);
      expect(await contract.supportedTokens(tokenAddress2)).to.equal(true);

      await contract.connect(owner).removeSupportedToken(tokenAddress2);
      expect(await contract.supportedTokens(tokenAddress2)).to.equal(false);
    });

    it("Should not allow removing an previously removed token", async function () {
      await contract.connect(owner).addSupportedToken(tokenAddress);
      expect(await contract.supportedTokens(tokenAddress)).to.equal(true);

      await contract.connect(owner).addSupportedToken(tokenAddress2);
      expect(await contract.supportedTokens(tokenAddress2)).to.equal(true);

      await contract.connect(owner).removeSupportedToken(tokenAddress2);
      expect(await contract.supportedTokens(tokenAddress2)).to.equal(false);

      await expect(contract.connect(owner).removeSupportedToken(tokenAddress2))
        .to.be.revertedWithCustomError(contract, errors.notSupported)
        .withArgs(tokenAddress2);
    });
  });

  describe("1.4. Role Assignment ", () => {
    describe("1.4.1. Check default Roles", () => {
      it("Should return correct default owner", async () => {
        const roleHash = await contract.MANAGER_ROLE();
        expect(roleHash).to.equals(constants.roles.MANAGER_ROLE);
        const checkManager = await contract.hasRole(roleHash, ownerAddress);
        expect(checkManager).to.equals(true);
      });

      it("Should return correct minter role", async () => {
        const roleHash = await contract.MINTER_ROLE();
        expect(roleHash).to.equals(constants.roles.MINTER_ROLE);
        const checkMinter = await contract.hasRole(roleHash, address1);
        expect(checkMinter).to.be.equals(true);
      });

      it("Should return correct fund manager role", async () => {
        const roleHash = await contract.FUND_MANAGER_ROLE();
        expect(roleHash).to.equals(constants.roles.FUND_MANAGER_ROLE);
        const checkFundManager = await contract.hasRole(roleHash, address2);
        expect(checkFundManager).to.be.equals(true);
      });

      it("Should return correct agency manager role", async () => {
        const roleHash = await contract.AGENCY_MANAGER_ROLE();
        expect(roleHash).to.equals(constants.roles.AGENCY_MANAGER_ROLE);
        const checkAgency = await contract.hasRole(roleHash, address3);
        expect(checkAgency).to.be.equals(true);
      });

      it("Should return correct contract approver role", async () => {
        const roleHash = await contract.CONTRACT_APPROVER_ROLE();
        expect(roleHash).to.equals(constants.roles.CONTRACT_APPROVER_ROLE);
        const checkContract = await contract.hasRole(roleHash, address4);
        expect(checkContract).to.be.equals(true);
      });

      it("Should return correct mint validator role", async () => {
        const roleHash = await contract.MINT_VALIDATOR_ROLE();
        expect(roleHash).to.equals(constants.roles.MINT_VALIDATOR_ROLE);
        const checkContract = await contract.hasRole(roleHash, address5);
        expect(checkContract).to.be.equals(true);
      });

      it("Should return correct contract refund Manager role", async () => {
        const roleHash = await contract.REFUND_MANAGER_ROLE();
        expect(roleHash).to.equals(constants.roles.REFUND_MANAGER_ROLE);
        const checkContract = await contract.hasRole(roleHash, address6);
        expect(checkContract).to.be.equals(true);
      });
    });

    describe("1.4.2. Check Role functionality", () => {
      it("Should Prevent unauthorised user to assign role", async () => {
        const role = roles.DEFAULT_ADMIN_ROLE;

        await expect(
          contract.connect(addr9).grantRole(roles.MANAGER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.MINTER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.FUND_MANAGER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.AGENCY_MANAGER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.ROYALTY_MANAGER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.CONTRACT_APPROVER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.MINT_VALIDATOR_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);

        await expect(
          contract.connect(addr9).grantRole(roles.REFUND_MANAGER_ROLE, addr9)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(address9, role);
      });

      it("Should allow authorised user to grant a role", async () => {
        const role = roles.MANAGER_ROLE;
        expect(await contract.connect(owner).grantRole(role, addr1))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, addr1);

        expect(await contract.hasRole(role, addr1)).to.equal(true);
      });

      it("Should only allow owner to grant role", async () => {
        expect(
          await contract.connect(owner).grantRole(roles.MANAGER_ROLE, addr1)
        )
          .to.emit(contract, "RoleGranted")
          .withArgs(roles.MANAGER_ROLE, addr1);

        expect(await contract.hasRole(roles.MANAGER_ROLE, addr1)).to.equal(
          true
        );

        await expect(
          contract.connect(addr1).grantRole(roles.MINT_VALIDATOR_ROLE, addr2)
        )
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(addr1, roles.DEFAULT_ADMIN_ROLE);
      });

      it("Should allow new manager to perform manager task", async () => {
        expect(
          await contract.connect(owner).grantRole(roles.MANAGER_ROLE, addr1)
        )
          .to.emit(contract, "RoleGranted")
          .withArgs(roles.MANAGER_ROLE, addr1);

        expect(await contract.hasRole(roles.MANAGER_ROLE, addr1)).to.equal(
          true
        );

        const newValue1 = "stealthUrl";
        const newValue = "baseUrl";

        await expect(contract.connect(owner).updateStealthUri(newValue1)).to.not
          .be.reverted;
        expect(await contract.stealthUri()).to.equal(newValue1);

        await expect(contract.connect(addr1).updateStealthUri(newValue)).to.not
          .be.reverted;
        expect(await contract.stealthUri()).to.equal(newValue);
      });

      it("Should allow new fund manager to withdraw native currency", async () => {
        const role = roles.FUND_MANAGER_ROLE;
        const newAccount = addr6;
        const value = BigInt(0.01 * priceMultiplier).toString();

        // Grant and confirm role
        expect(await contract.connect(owner).grantRole(role, newAccount))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, newAccount);
        expect(await contract.hasRole(role, newAccount)).to.equal(true);
        expect(await addr1.sendTransaction({ to: contractAdr, value: value }))
          .to.not.be.reverted;

        // Withdraw Funds
        await expect(
          contract.connect(newAccount)[constants.functions.withdraw]()
        ).to.not.be.reverted;

        // Confirm if funds are correct
        expect(await ethers.provider.getBalance(contractAdr)).to.equal(0);
      });

      it("Should allow authorised user to revoke a role", async () => {
        const role = roles.FUND_MANAGER_ROLE;
        expect(await contract.connect(owner).grantRole(role, addr8))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, addr1);

        expect(await contract.hasRole(role, addr8)).to.equal(true);
        await expect(contract.connect(owner).revokeRole(role, addr8))
          .to.emit(contract, "RoleRevoked")
          .withArgs(role, addr8, owner);
      });

      it("Should prevent un-authorised user to revoke a role", async () => {
        const role = roles.FUND_MANAGER_ROLE;
        expect(await contract.connect(owner).grantRole(role, addr8))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, addr1);

        expect(await contract.hasRole(role, addr8)).to.equal(true);

        await expect(contract.connect(addr8).revokeRole(role, addr8))
          .to.be.revertedWithCustomError(
            contract,
            constants.errors.acUnauthorized
          )
          .withArgs(addr8, roles.DEFAULT_ADMIN_ROLE);

        expect(await contract.hasRole(role, addr8)).to.equal(true);
      });

      it("Should allow user to renounce their own role", async () => {
        const roleWallet = addr9;
        const role = roles.FUND_MANAGER_ROLE;
        await expect(contract.connect(owner).grantRole(role, roleWallet))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, roleWallet, owner);

        expect(await contract.hasRole(role, roleWallet)).to.equal(true);
        await expect(
          contract.connect(roleWallet).renounceRole(role, roleWallet)
        )
          .to.emit(contract, "RoleRevoked")
          .withArgs(role, roleWallet, roleWallet);
      });

      it("Should not grant a role that is already granted", async () => {
        const roleWallet = addr7;
        const role = roles.FUND_MANAGER_ROLE;
        await expect(contract.connect(owner).grantRole(role, roleWallet))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, roleWallet, owner);

        expect(await contract.hasRole(role, roleWallet)).to.equal(true);
        await expect(
          contract.connect(owner).grantRole(role, roleWallet)
        ).to.not.emit(contract, "RoleGranted");
        expect(await contract.hasRole(role, roleWallet)).to.equal(true);
      });

      it("Should only allow role user to renounce their role", async () => {
        const roleWallet = addr7;
        const role = roles.FUND_MANAGER_ROLE;

        await expect(contract.connect(owner).grantRole(role, roleWallet))
          .to.emit(contract, "RoleGranted")
          .withArgs(role, roleWallet, owner);

        expect(await contract.hasRole(role, roleWallet)).to.equal(true);

        await expect(
          contract.connect(addr1).renounceRole(role, roleWallet)
        ).to.be.revertedWithCustomError(contract, constants.errors.acBadConf);

        expect(await contract.hasRole(role, roleWallet)).to.equal(true);
        await expect(
          contract.connect(owner).renounceRole(role, roleWallet)
        ).to.be.revertedWithCustomError(contract, constants.errors.acBadConf);

        expect(await contract.hasRole(role, roleWallet)).to.equal(true);
      });

      it("Should have role admin as default admin for all roles", async () => {
        expect(await contract.getRoleAdmin(roles.DEFAULT_ADMIN_ROLE)).to.equal(
          roles.DEFAULT_ADMIN_ROLE
        );
        expect(await contract.getRoleAdmin(roles.MANAGER_ROLE)).to.equal(
          roles.DEFAULT_ADMIN_ROLE
        );
        expect(await contract.getRoleAdmin(roles.FUND_MANAGER_ROLE)).to.equal(
          roles.DEFAULT_ADMIN_ROLE
        );
        expect(await contract.getRoleAdmin(roles.MINT_VALIDATOR_ROLE)).to.equal(
          roles.DEFAULT_ADMIN_ROLE
        );
        expect(await contract.getRoleAdmin(roles.REFUND_MANAGER_ROLE)).to.equal(
          roles.DEFAULT_ADMIN_ROLE
        );
      });
    });
  });

  describe("1.5. Withdrawals", () => {
    describe("1.5.1 Native Currency", () => {
      it("Should prevent unauthorized user from withdrawing", async () => {
        await expect(contract.connect(addr9)[constants.functions.withdraw]())
          .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
          .withArgs(anyValue, anyValue);
      });

      it("Should allow withdrawal of balance", async () => {
        const value = BigInt(0.1 * priceMultiplier).toString();

        // Transfer funds to contract and check
        await addr1.sendTransaction({
          to: contractAdr,
          value: value,
        });
        const contractBalanceBefore = await ethers.provider.getBalance(
          contract
        );
        expect(contractBalanceBefore).to.equal(value);
        await contract
          .connect(owner)
          .grantRole(roles.FUND_MANAGER_ROLE, ownerAddress);
        expect(await contract.hasRole(roles.FUND_MANAGER_ROLE, ownerAddress)).to
          .be.true;
        // Withdraw and check
        await expect(
          await contract.connect(owner)[constants.functions.withdraw]()
        ).to.changeEtherBalance(owner, value);
        expect(await ethers.provider.getBalance(contract)).to.equal(
          BigInt(0).toString()
        );
      });

      it("Should allow withdrawal of balance after Mint with Native", async () => {
        const creator = addr1;
        const buyer = addr2;
        const validator = addr5;

        const details = {
          price: 0.01,
          quantity: 10,
          buyerQty: 1,
          start: 0,
          end: 0,
          royalty: 100,
          stealth: false,
          sbt: false,
          tokenAdr: null,
        };

        const platformValue = getFee(details.price, false, details.buyerQty);
    

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
          addr1,
          addr5
        );
        // console.log(vr);
        const tx = await contract
          .connect(addr2)
          [
            "mintNftNative((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address)"
          ](vr, address2, { value: vr.price });
        expect(tx).to.not.be.reverted;
        expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);
        // Check Balances
        const contractBal = await ethers.provider.getBalance(contractAdr);
        expect(contractBal).to.equal(platformValue);

        await contract
          .connect(owner)
          .grantRole(roles.FUND_MANAGER_ROLE, ownerAddress);

        const ownerBalBefore = await ethers.provider.getBalance(ownerAddress);
        // Withdraw balance
        const withdrawTx = await contract
          .connect(owner)
          [constants.functions.withdraw]();
        await expect(withdrawTx).to.not.reverted;
        const receipt = await ethers.provider.getTransactionReceipt(
          withdrawTx.hash
        );
        // console.log("The gasUsed: ", receipt.gasUsed);
        // console.log("The gasPrice: ", receipt.gasPrice);
        const gas = receipt.gasUsed * receipt.gasPrice;
        // console.log("Gas Cost: ", gas);

        // Check the balances of everything
        const newBalance = ownerBalBefore + platformValue - gas;
        // console.log("Previous Balance", ownerBalBefore);
        // console.log("Value: ", platformValue);
        // console.log("Latest Balance: ", newBalance);
        // console.log(await ethers.provider.getBalance(ownerAddress));
        expect(await ethers.provider.getBalance(contractAdr)).to.equal(
          BigInt(0)
        );
        expect(await ethers.provider.getBalance(ownerAddress)).to.equal(
          newBalance
        );
      });
    });

    describe("1.5.2 Token ", () => {
      const addSupportedToken = contractConst.functions.addSupportedToken;

      it("Should revert when trying to withdraw unsupported token", async () => {
        // Deploy the Token
        const usdtFactory = await ethers.getContractFactory(
          constants.contracts.test.files.usdt
        );
        const usdtToken = await usdtFactory.deploy();
        await usdtToken.waitForDeployment();
        const usdtTokenAdr = await usdtToken.getAddress();
        // console.log(usdtTokenAdr);
        //0xD49a0e9A4CD5979aE36840f542D2d7f02C4817Be
        await contract.grantRole(roles.FUND_MANAGER_ROLE, ownerAddress);
        expect(await contract.hasRole(roles.FUND_MANAGER_ROLE, ownerAddress));
        // Try to withdraw should revert
        await expect(
          contract
            .connect(owner)
            [constants.functions.withdrawToken](usdtTokenAdr)
        )
          .revertedWithCustomError(contract, errors.notSupported)
          .withArgs(usdtTokenAdr);
      });

      it("Should prevent unauthorised user from withdrawing", async () => {
        // Deploy the Token
        const usdtFactory = await ethers.getContractFactory(
          constants.contracts.test.files.usdt
        );
        const usdtToken = await usdtFactory.deploy();
        await usdtToken.waitForDeployment();
        const usdtTokenAdr = await usdtToken.getAddress();

        // Approve Contract for token
        await contract.connect(owner)[addSupportedToken](usdtTokenAdr);

        // Try to withdraw from non admin should revert since no balance
        await expect(
          contract
            .connect(addr9)
            [constants.functions.withdrawToken](usdtTokenAdr)
        )
          .to.be.revertedWithCustomError(contract, errors.acUnauthorized)
          .withArgs(anyValue, anyValue);
      });

      it("Should allow withdrawal of balance after Mint with Token", async () => {
        const creator = addr1;
        const buyer = addr2;
        const validator = addr5;

        // Deploy the Token
        const usdtFactory = await ethers.getContractFactory(
          constants.contracts.test.files.usdt,
          buyer
        );
        const usdtToken = await usdtFactory.deploy();
        await usdtToken.waitForDeployment();
        const usdtTokenAdr = await usdtToken.getAddress();

        // Approve Contract for token
        await contract.connect(owner)[addSupportedToken](usdtTokenAdr);

        // Send gift with token
        const details = {
          price: 0.01,
          quantity: 10,
          buyerQty: 1,
          start: 0,
          end: 0,
          royalty: 100,
          stealth: false,
          sbt: false,
          tokenAdr: usdtTokenAdr,
        };

        const msgValue = getMsgValue(
          details.price,
          false,
          false,
          details.buyerQty
        );
        // console.log(msgValue);
        const platformValue = getFee(details.price, false);
        // console.log(platformValue);
        // Approve tokens before mint
        expect(await usdtToken.connect(buyer).approve(contractAdr, msgValue)).to
          .not.be.reverted;
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
          addr1,
          addr5
        );
        // console.log(vr);
        const tx = await contract
          .connect(buyer)
          [
            "mintNftWithToken((uint256,uint256,uint256,uint256,uint256,uint256,uint96,bool,bool,bytes,bytes),address,address)"
          ](vr, usdtTokenAdr, buyer.address);
        expect(tx).to.not.be.reverted;
        expect(await contract.balanceOf(address2, vr.tokenId)).to.equal(1);
     
        await contract.grantRole(roles.FUND_MANAGER_ROLE, ownerAddress);

        // Withdraw balance
        expect(await usdtToken.balanceOf(contractAdr)).to.equal(platformValue);
        await expect(
          contract
            .connect(owner)
            [constants.functions.withdrawToken](usdtTokenAdr)
        ).to.not.reverted;

        // Check the balances of everything
        expect(await usdtToken.balanceOf(contractAdr)).to.equal(
          BigInt(0).toString()
        );
        expect(await usdtToken.balanceOf(owner)).to.equal(platformValue);
      });

      it("Should prevent withdrawing of token that is not supported", async () => {
        // Deploy the Token
        const usdtFactory = await ethers.getContractFactory(
          constants.contracts.test.files.usdt
        );
        const usdtToken = await usdtFactory.deploy();
        await usdtToken.waitForDeployment();
        const usdtTokenAdr = await usdtToken.getAddress();
        await contract.grantRole(roles.FUND_MANAGER_ROLE, ownerAddress);
        await expect(
          contract
            .connect(owner)
            [constants.functions.withdrawToken](usdtTokenAdr)
        )
          .to.be.revertedWithCustomError(contract, errors.notSupported)
          .withArgs(usdtTokenAdr);
      });
    });
  });
});
