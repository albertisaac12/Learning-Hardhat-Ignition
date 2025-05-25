# Hardhat Ignition

## Types of Futures

```javascript
// create a contract
const token = m.contract("Token", ["My Token", "TKN", 18]);
const bar = m.contract("ReceivesETH", [], { value: 1_000_000_000n });

// Use an existing contract
const existingToken = m.contractAt("Token", "0x...");

// functions
m.call(token, "transfer", [receiver, amount]);

// view and pure functions
const balance = m.staticCall(token, "balanceOf", [address]);

// events
const transfer = m.call(token, "transfer", [receiver, amount]);
const value = m.readEventArgument(transfer, "Transfer", "_value", {
  emitter,
  eventIndex,
});

// Arbitrary data and ETH to a address or a smart contract
const send = m.send("SendETH", address, 1_000_000n); // Send ETH
const send = m.send("SendData", address, undefined, "0x16417104"); // Send data

// Pass futures as Arguments
const foo = m.contract("ReceivesAnAddress", [token]); // Uses token's address at deploy time
```

## Dependencies between future objects

```javascript
const token = m.contract("Token", ["My Token", "TKN", 18]);
const receiver = m.contract("Receiver", [], {
  after: [token], // `receiver` is deployed after `token`
});
```
