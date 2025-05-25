const hre = require("hardhat");
const constants = require("./../utils/constants");
const {generateTokenId,getSignedVoucher} = require("../utils/voucherGen");
async function main() {

    const logicFactory = await hre.ethers.getContractFactory("logic");
    const logic = await logicFactory.deploy("meow");
    await logic.waitForDeployment();

    const logicAddress = await logic.getAddress();

    const creationsFactory = await hre.ethers.getContractFactory("dappunkCreations");

    const [owner,creator,buyer] = await hre.ethers.getSigners();

    console.log("The Validator : ",owner.address);
    console.log("The Creator : ",creator.address);
    const creations = await creationsFactory.deploy(owner.address,owner.address,owner.address,owner.address,owner.address,owner.address,owner.address,logicAddress);

    await creations.waitForDeployment();

    const creationsAddress = await creations.getAddress();

    console.log("CreationsAddress: ", creationsAddress);

    console.log("is having the role: ", await creations.hasRole(constants.roles.DEFAULT_ADMIN_ROLE,owner.address));

    const tokenId= generateTokenId(creator.address,1,1);
    console.log(tokenId);


    const values = {
        tokenId: hre.ethers.toBigInt(tokenId.toString()),
        price: ethers.toBigInt("100000000000000000000"),
        quantity: ethers.toBigInt("100"),
        buyerQty: ethers.toBigInt("4"),
        start: ethers.toBigInt("1748207302"),
        end: ethers.toBigInt("1748207301"),
        royalty: 0,
        isStealth: false,
        isSbt: false,
      };

    // generateVoucher
    const voucher = await getSignedVoucher(creations,"1155",values,creator,owner);
    console.log(voucher);

    const cr = await creations.verifyVoucher(voucher);
    console.log(cr);

    const mint = await creations.connect(owner).mintNft(voucher,buyer.address);
    
    const receipt = await mint.wait();
    // console.log(receipt);

    console.log(await creations.balanceOf(buyer.address,voucher.tokenId));



}

main();

//0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
//0x70997970C51812dc3A010C7d01b50e0d17dc79C8