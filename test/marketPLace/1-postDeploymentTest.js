const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const {
  roles,
  zero,
  platformFees,
  txnFees,
  domains,
  contracts,
  errors,
  events,
} = require("./../../utils/marketPlaceConstants");

describe("Dappunk Meta Market Place Post deployment Test", () => {
  let owner, signer1, signer2, signer3;
  let contractNFT, contract1155, contractMp, contractPunk;
  let nft, mnft, mp, token;
  let nftAddress, mnftAddress, mpAddress, tokenAddress;
  let ownerAddress, signer1Address, signer2Address, signer3Address;
  let func = contracts.metaMarketPlace.functions;
  let logicFactory, logicContract, logicAddress;
  beforeEach(async function () {
    [owner, signer1, signer2, signer3] = await ethers.getSigners();
    ownerAddress = owner.address;
    signer1Address = signer1.address;
    signer2Address = signer2.address;
    signer3Address = signer3.address;
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

    token = await await upgrades.deployProxy(contractPunk, [ownerAddress], {
      kind: "uups",
    });
    await token.waitForDeployment();

    tokenAddress = await token.getAddress();

    mp = await contractMp.deploy(
      mnftAddress,
      platformFees,
      ownerAddress,
      ownerAddress,
      ownerAddress,
      logicAddress
    );

    mpAddress = await mp.getAddress();

    // await nft[func.grantRole](roles.MARKET_PLACE, mpAddress);
    await mnft[func.grantRole](roles.MARKET_PLACE, mpAddress);
    await token[func.grantRole](roles.MARKET_PLACE, mpAddress);
  });
  describe("1 Post Deployment Check", () => {
    it("1.1 Should be deployed with correct roles", async () => {
      expect(await mp.DEFAULT_ADMIN_ROLE()).to.equal(zero);
      expect(await mp.RELAYER_ROLE()).to.equal(roles.RELAYER_ROLE);
      expect(await mnft.MARKET_PLACE()).to.equal(roles.MARKET_PLACE);
      expect(await token.MARKET_PLACE()).to.equal(roles.MARKET_PLACE);
      expect(await mp[func.hasRole](roles.RELAYER_ROLE, ownerAddress)).to.equal(
        true
      );
      expect(await mnft[func.hasRole](roles.MARKET_PLACE, mpAddress)).to.equal(
        true
      );
      expect(await token[func.hasRole](roles.MARKET_PLACE, mpAddress)).to.equal(
        true
      );
    });
    it("1.2 Should be deployed with the correct Domain Information", async () => {
      let domain = await mp.eip712Domain();
      expect(domain.fields).to.equal("0x0f");
      expect(domain.name).to.equal(domains.name);
      expect(domain.version).to.equal(domains.version);
      expect(domain.verifyingContract).to.equal(mpAddress);
      expect(domain.salt).to.equal(zero);
    });
    it("1.3 Should be deployed with correct 1155 address", async () => {
      expect(await mp.nft()).to.equal(mnftAddress);
    });
    it("1.4 Should be deployed with the correct $PUNK address", async () => {
      await mp.connect(owner).setTokenAddress(tokenAddress);
      expect(await mp.punk()).to.equal(tokenAddress);
    });
    it("1.5 Should be deployed with the correct platform fees", async () => {
      expect(await mp.platformFees()).to.equal(platformFees);
    });
  });
});
