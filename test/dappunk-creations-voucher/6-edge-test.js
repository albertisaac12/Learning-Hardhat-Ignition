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

describe("5. Edge Cases", () => {
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

    it("Should return false if token is not locked", async () => {
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
      
      expect(await contract.locked(voucher.tokenId)).to.be.false;
    });

    it("Should revert Gasless mint if deprecated", async function () {
          const creator = addr1;
          const creatorWallet = address1;
          const buyer = addr4;
          const buyerWallet = address4;
          const validator = addr5;
          
          await contract.grantRole(roles.RELAYER_ROLE,ownerAddress);
          await contract.connect(owner).deprecate();
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
    
          await expect(contract.connect(addr11).mintNftGasless(voucher, address4, options)).to.be.reverted;
           
        });
        it("Should revert Gasless mint if RELAYER ROLE is absent", async function () {
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
          
         await expect(contract.connect(addr11).mintNftGasless(voucher, address4, options)).to.be.reverted;
        
        });

  });
});
