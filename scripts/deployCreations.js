const hre = require("hardhat");
const constants = require("./../utils/constants");
const {generateTokenId,getSignedVoucher} = require("../utils/voucherGen");
async function main() {

  const [owner,minter,fundManager,agencyManager,contractApprover,mintValidator,refundManager] = await hre.ethers.getSigners();
    
  // const logicFactory = await hre.ethers.getContractFactory("logic");
  //   const logic = await logicFactory.connect(owner).deploy("dpLogicV1");
  //   await logic.waitForDeployment();

  //   const logicAddress = await logic.getAddress();

    const creationsFactory = await hre.ethers.getContractFactory("dappunkCreations");


    // console.log(owner.address);
    // console.log(minter.address);
    // console.log(fundManager.address);
    // console.log(agencyManager.address);
    // console.log(contractApprover.address);
    // console.log(mintValidator.address);
    // console.log(refundManager.address);
    // console.log(logicAddress);
  
    const creations = await creationsFactory.connect(owner).deploy(
      owner.address,
      minter.address,
      fundManager.address,
      agencyManager.address,
      contractApprover.address,
      mintValidator.address,
      refundManager.address,
      "0xc85f9D655c3a2060e217DaF35976D0Ecd17D7257"
    );

    await creations.waitForDeployment();

    const creationsAddress = await creations.getAddress();

    console.log("CreationsAddress: ", creationsAddress);

    console.log("is having the role: ", await creations.hasRole(constants.roles.DEFAULT_ADMIN_ROLE,owner.address));

    // const tokenId= generateTokenId(creator.address,1,1);
    // console.log(tokenId);


    // const values = {
    //     tokenId: hre.ethers.toBigInt(tokenId.toString()),
    //     price: ethers.toBigInt("100000000000000000000"),
    //     quantity: ethers.toBigInt("100"),
    //     buyerQty: ethers.toBigInt("4"),
    //     start: ethers.toBigInt("0"),
    //     end: ethers.toBigInt("0"),
    //     royalty: 0,
    //     isStealth: false,
    //     isSbt: false,
    //   };

    // // generateVoucher
    // const voucher = await getSignedVoucher(creations,"1155",values,creator,owner);
    // console.log(voucher);

    // const cr = await creations.verifyVoucher(voucher);
    // console.log(cr);

    // const mint = await creations.connect(owner).mintNft(voucher,buyer.address);
    
    // const receipt = await mint.wait();
    // // console.log(receipt);

    // console.log(await creations.balanceOf(buyer.address,voucher.tokenId));
    
    // const values2 = {
    //    tokenId: hre.ethers.toBigInt(tokenId.toString()),
    //    price: ethers.toBigInt("100000000000000000000"),
    //    quantity: ethers.toBigInt("101"),
    //    buyerQty: ethers.toBigInt("4"),
    //    start: ethers.toBigInt("0"),
    //    end: ethers.toBigInt("0"),
    //    royalty: 0,
    //    isStealth: false,
    //    isSbt: false,
    //  };

    //  const voucher2 = await getSignedVoucher(creations,"1155",values2,creator,owner);


}

main();

//0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
//0x70997970C51812dc3A010C7d01b50e0d17dc79C8


// ownerAddress, // manager
//       address1, // minter
//       address2, // fundManager
//       address3, // agencyManager
//       address4, // contractApprover
//       address5, // mintValidator
//       address6, // refundManager
//       logicAddress, // forwarder