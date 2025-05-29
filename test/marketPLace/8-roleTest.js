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
} = require("../../utils/marketPlaceConstants");

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

    await mp.connect(owner).setTokenAddress(tokenAddress);
  });
  describe("8 Role Test", async () => {
    it("8.1 Default Admin should be able to grant Role", async () => {
      await mp.connect(owner).grantRole(roles.RELAYER_ROLE, signer1Address);
      await mp.connect(owner).grantRole(roles.MARKET_PLACE, signer1Address);

      expect(await mp.hasRole(roles.RELAYER_ROLE, signer1Address)).to.be.true;
      expect(await mp.hasRole(roles.MARKET_PLACE, signer1Address)).to.be.true;
    });
    it("8.2 Default Admin should be able to Revoke Role", async () => {
      await mp.connect(owner).grantRole(roles.RELAYER_ROLE, signer1Address);
      await mp.connect(owner).grantRole(roles.MARKET_PLACE, signer1Address);

      await mp.connect(owner).revokeRole(roles.RELAYER_ROLE, signer1Address);
      await mp.connect(owner).revokeRole(roles.MARKET_PLACE, signer1Address);

      expect(await mp.hasRole(roles.MARKET_PLACE, signer1Address)).to.be.false;
      expect(await mp.hasRole(roles.RELAYER_ROLE, signer1Address)).to.be.false;
    });
    it("8.3 Role Owners should be able to renounce Role", async () => {
      await mp.connect(owner).grantRole(roles.RELAYER_ROLE, signer1Address);
      await mp.connect(owner).grantRole(roles.MARKET_PLACE, signer1Address);

      await mp
        .connect(signer1)
        .renounceRole(roles.RELAYER_ROLE, signer1Address);
      await mp
        .connect(signer1)
        .renounceRole(roles.MARKET_PLACE, signer1Address);

      expect(await mp.hasRole(roles.RELAYER_ROLE, signer1Address)).to.be.false;

      expect(await mp.hasRole(roles.MARKET_PLACE, signer1Address)).to.be.false;
    });
  });
});
