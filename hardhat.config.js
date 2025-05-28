require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: true,
    outputJSON: true,
    outputJSONFile: "gas.json",
    includeBytecodeInJSON: true,
    suppressTerminalOutput: false,
    includeIntrinsicGas: true,
  },
  networks:{
    polygonAmoy:{
      url: process.env.A_RPC,
      accounts: [process.env.owner, process.env.minter, process.env.fundManager,process.env.agencyManager,process.env.contractApprover,process.env.mintValidator,process.env.refundManager],
      chainId: 80002,
      gas: "auto",

    }
  },
   etherscan: {
    apiKey: {
      polygonAmoy: process.env.AE_API,
    },
  }
  
};
