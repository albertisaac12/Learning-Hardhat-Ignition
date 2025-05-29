const { ethers } = require("hardhat");
const {
  roles,
  platformFees,
  contracts,
  errors,
  events,
} = require("../utils/marketPlaceConstants");
async function main() {
  const [owner, signer1] = await ethers.getSigners();
  const cf = await ethers.getContractFactory("metaMarketPlace");

  console.log(owner.address);
  const mp = await cf.connect(owner).deploy(
    "0xa7eAbd05AcC3a01910154937f8FDFc95BCA2386d", // creations
    1000, // platformFees
    "0x1dD4724817Bac200fd22Cb6237Ca5db88Da01824", // refundManager
    "0x4910A3E9f7d9A04eEed15093F33f9Ec26d480F2D", // relayer
    "0x4910A3E9f7d9A04eEed15093F33f9Ec26d480F2D", // manager
    "0xc85f9D655c3a2060e217DaF35976D0Ecd17D7257" // forwarder
  );
  await mp.waitForDeployment();
  console.log("Deploying MarketPlace");
  const address = await mp.getAddress();

  console.log("MarketPlace Deployed at: ", address);

  console.log(await mp.hasRole(roles.REFUND_MANAGER_ROLE,"0x1dD4724817Bac200fd22Cb6237Ca5db88Da01824"));
}

main();


// address m1155, uint256 platformFess, address refundManager , address relayer, address manager, address forwarder

// 0x985AFc7393F68A2088dc1ed67B733756cafdd184