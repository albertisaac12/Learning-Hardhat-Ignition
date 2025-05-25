const {buildModule} = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Logic",(fw)=>{
    const logicContract = fw.contract("logic",["meow"],{id:"forwarder"});

    return {forwarder:logicContract}
});