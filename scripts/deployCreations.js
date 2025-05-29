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
  
    // const creations = await creationsFactory.connect(owner).deploy(
    //   owner.address,
    //   minter.address,
    //   fundManager.address,
    //   agencyManager.address,
    //   contractApprover.address,
    //   mintValidator.address,
    //   refundManager.address,
    //   "0xc85f9D655c3a2060e217DaF35976D0Ecd17D7257"
    // );

    // await creations.waitForDeployment();

    const creations = creationsFactory.attach("0xa7eAbd05AcC3a01910154937f8FDFc95BCA2386d");

    const creationsAddress = await creations.getAddress();

    console.log("CreationsAddress: ", creationsAddress);

    console.log("is having the role: ", await creations.hasRole(constants.roles.MINTER_ROLE,minter.address));

    const tokenId= generateTokenId(owner.address,1,1);
    console.log(tokenId);


    const values = {
        tokenId: hre.ethers.toBigInt(tokenId.toString()),
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("100"),
        buyerQty: ethers.toBigInt("4"),
        start: ethers.toBigInt("0"),
        end: ethers.toBigInt("0"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };
    
    // const voucher = {
    //     tokenId: hre.ethers.toBigInt("111753951200806924692938018716121203314546885550124212286199343506162710478849"),
    //     price: ethers.toBigInt("3000000000000000000"),
    //     quantity: ethers.toBigInt("10000"),
    //     buyerQty: ethers.toBigInt("1"),
    //     start: ethers.toBigInt("0"),
    //     end: ethers.toBigInt("0"),
    //     royalty: 0,
    //     isStealth: false,
    //     isSbt: false,
    //     creator:"0x8d26499d20ba55e327aece97289670b2ea2110c7155ab8cdebdfcf59400245fd300eefdb10a4d62c3bc2f60a3406303bca5bc7546367363a79ac15a5548ab9491c",
    //     validator:"0x97d5556649ebf17e937ca42787198d60d695686f235dde7046b2d4fa0a5cf163096c70da578f6694aa4323931cb0c397c72fd11968f09119faa510c8fe7ce82f1c"
    //   };

    // // generateVoucher
    const voucher = await getSignedVoucher(creations,"1155",values,owner,mintValidator);
    console.log(voucher);
    try {  
      const cr = await creations.verifyVoucher(voucher);
      console.log(cr);
    } catch(error) {
      console.log(error);
    }
    const mint = await creations.connect(minter).mintNft(voucher,fundManager.address);
    
    const receipt = await mint.wait();
    console.log(receipt);

    console.log(await creations.balanceOf(fundManager.address,voucher.tokenId));
    
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