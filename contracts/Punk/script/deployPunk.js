const { ethers, upgrades } = require("hardhat");

async function main() {
  const [owner, signer1] = await ethers.getSigners();
  const cf = await ethers.getContractFactory("punkToken11");
  const token = await upgrades.deployProxy(cf, [owner.address], {
    kind: "uups",
  });
  await token.waitForDeployment();
  console.log("Deploying Token");
  const address = await token.getAddress();
  console.log("Token Deployed at: ", address);

}

main();
