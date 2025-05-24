require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
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
};
