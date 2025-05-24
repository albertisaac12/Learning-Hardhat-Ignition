const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules"); // modules are created using buildModule

module.exports = buildModule("Apollo", (m) => {
  const apollo = m.contract("Rocket", ["Saturn V"]);

  m.call(apollo, "launch", []);

  return { apollo };
});
