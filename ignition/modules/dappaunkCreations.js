const {buildModule} = require("@nomicfoundation/hardhat-ignition/modules");
const Logic = require("./deployForwarder");
const constants = require("./../../utils/constants")
module.exports = buildModule("creations", (dpc)=> {
    const roles = constants.roles;
    const account1 = dpc.getAccount(1);
    const logic = dpc.useModule(Logic);
    const creations = dpc.contract("dappunkCreations",[account1,account1,account1,account1,account1,account1,account1,account1],{id:"creations",after:[logic.forwarder]});
    // console.log("This is the entire creations",creations);
    const ok = dpc.call(creations,"hasRole",[roles.DEFAULT_ADMIN_ROLE,account1]);
    console.log(ok);
    return { nft1155:creations };
});