# ChainSplit — Decentralized Group Expense Sharing DApp

> **Blockchain & Decentralized Applications (CBD) — Experiment 7**
> Built with Truffle Suite + Ganache | Solidity v0.8.19 | Node.js v24

---

## What Is ChainSplit?

ChainSplit is a decentralized application (DApp) that solves a real-world problem:

**When a group of friends shares expenses (trips, dinners, rent), tracking who owes whom and actually transferring money requires trusting a central app like Splitwise.**

ChainSplit removes that trust requirement entirely. All expense tracking, balance calculation, and debt settlement happens through smart contracts on the Ethereum blockchain — no company, no server, no middleman. The rules are written in code, deployed immutably on-chain, and execute automatically.

---

## Problem Statement

Traditional expense-sharing apps (Splitwise, Settle Up) have fundamental limitations:
- Centralized servers — the company controls your financial data
- No real money movement — balances are just database entries
- Can be shut down, hacked, or manipulated
- Requires trusting a third party

**ChainSplit solves this by:**
- Recording all expenses and balances on the Ethereum blockchain (immutable)
- Enabling actual ETH transfers for debt settlement (real value movement)
- Enforcing rules via smart contracts (trustless, tamper-proof)
- Giving users full ownership of their financial data

---

## Current Implementation (Experiment 7 — Smart Contracts Layer)

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity v0.8.19 |
| Development Framework | Truffle v5.11.5 |
| Local Blockchain | Ganache CLI v7.9.2 |
| Runtime | Node.js v24.12.0 |
| Package Manager | npm v11.6.2 |

### Project Structure
```
CBD_EXP/
├── contracts/
│   ├── ExpenseManager.sol       ← Contract 1: core expense logic
│   └── SettlementManager.sol    ← Contract 2: ETH settlement + inherits ExpenseManager
├── migrations/
│   └── 2_deploy_contracts.js    ← deployment script (deploys both contracts)
├── test/
│   └── chainsplit_test.js       ← 10 Mocha test cases (all passing)
├── build/
│   └── contracts/               ← compiled ABI + bytecode (auto-generated)
└── truffle-config.js            ← network config (Ganache at 127.0.0.1:7545)
```

---

## Smart Contracts — Deep Dive

### Contract 1: `ExpenseManager.sol`

**Purpose:** Handles the full group expense lifecycle.

**Data Structures:**
```solidity
struct Group {
    uint256 id;
    string name;
    address admin;         // only admin can add members
    address[] members;
    uint256[] expenseIds;
}

struct Expense {
    uint256 id;
    string description;
    uint256 amount;        // in wei
    address payer;
    address[] participants;
    bool settled;
}
```

**Balance System:**
```solidity
mapping(uint256 => mapping(address => int256)) public balances;
// groupId => userAddress => balance
// Positive = you are owed money
// Negative = you owe money
// Zero     = settled
```

**Key Functions:**
| Function | What it does |
|----------|-------------|
| `createGroup(name)` | Creates a new expense group, creator becomes admin |
| `addMember(groupId, address)` | Admin adds a member to the group |
| `addExpense(groupId, description, amount, participants[])` | Records expense, auto-splits equally, updates balances |
| `getBalance(groupId, address)` | Returns signed int256 balance for a user in a group |
| `getMembers(groupId)` | Returns all member addresses |
| `getGroupExpenses(groupId)` | Returns all expense IDs for a group |

**Split Logic:**
```solidity
uint256 share = _amount / _participants.length;
for (uint256 i = 0; i < _participants.length; i++) {
    if (_participants[i] != msg.sender) {
        balances[_groupId][_participants[i]] -= int256(share);  // non-payers owe
        balances[_groupId][msg.sender] += int256(share);        // payer is owed
    }
}
```

**Events emitted:** `GroupCreated`, `MemberAdded`, `ExpenseAdded`

---

### Contract 2: `SettlementManager.sol`

**Purpose:** Inherits all of ExpenseManager and adds real ETH settlement capability.

```solidity
contract SettlementManager is ExpenseManager { ... }
```

**Key Functions:**
| Function | What it does |
|----------|-------------|
| `settle(groupId, receiver)` | Sends ETH to receiver, updates both balances on-chain |
| `isSettled(groupId, address)` | Returns true if balance == 0 |
| `getNetBalance(groupId, address)` | Returns human-readable status + amount |

**Settlement Logic:**
```solidity
function settle(uint256 _groupId, address payable _receiver) public payable {
    balances[_groupId][msg.sender] += int256(msg.value);  // sender's debt reduces
    balances[_groupId][_receiver] -= int256(msg.value);   // receiver's credit reduces
    _receiver.transfer(msg.value);                         // actual ETH transfer
    emit SettlementMade(_groupId, msg.sender, _receiver, msg.value);
}
```

**`getNetBalance` returns:**
- `"You are owed"` → balance is positive (you paid, waiting for reimbursement)
- `"You owe"` → balance is negative (you need to send ETH)
- `"Settled"` → balance is exactly zero

**Events emitted:** `SettlementMade`, `BalanceCleared`

---

## Test Suite — 10 Test Cases (All Passing)

File: `test/chainsplit_test.js`

| TC | Test | What it validates |
|----|------|------------------|
| TC1 | Group creation emits event | `GroupCreated` event fires on `createGroup` |
| TC2 | Group count increments | `groupCount` is 1 after first group |
| TC3 | Admin auto-added as first member | Creator's address is `members[0]` |
| TC4 | Admin can add members | `addMember` works when called by admin |
| TC5 | Non-admin blocked from adding members | Reverts with "Only admin" message |
| TC6 | Expense recorded correctly | `expenseCount` increments after `addExpense` |
| TC7 | Non-payer gets negative balance | `getBalance` returns negative for non-payer |
| TC8 | Payer gets positive balance | `getBalance` returns positive for payer |
| TC9 | Settlement updates balance | Balance increases (less negative) after `settle` |
| TC10 | `getNetBalance` returns valid status | Returns one of: "You are owed", "You owe", "Settled" |

**Run tests:**
```bash
ganache --port 7545        # Terminal 1 — keep running
truffle test               # Terminal 2
```

**Important note on testing:** TC9 uses `settlementManager` (separate contract instance from `expenseManager`). For console interactions, always use `sm` (SettlementManager) for ALL operations — since it inherits from ExpenseManager, it has all functions. Using `em` for expenses and `sm` for settlement causes a cross-contract state issue because they have separate storage.

---

## How to Run This Project

### Prerequisites
```bash
node -v        # v24+
npm -v         # v11+
npm install -g truffle
npm install -g ganache
```

### Step-by-Step
```bash
# 1. Clone the repo
git clone https://github.com/aditya-debugs/chain_split-cbd.git
cd chain_split-cbd

# 2. Start local blockchain (Terminal 1 — keep this running)
ganache --port 7545

# 3. Compile contracts (Terminal 2)
truffle compile

# 4. Deploy to local blockchain
truffle migrate --reset

# 5. Run all tests
truffle test

# 6. Open interactive console
truffle console
```

### Console Quickstart (copy these one by one)
```javascript
var sm = await SettlementManager.deployed()
var accounts = await web3.eth.getAccounts()
await sm.createGroup("ChainSplit Group")
await sm.addMember(1, accounts[1])
var amount = web3.utils.toWei("1", "ether")
await sm.addExpense(1, "Dinner", amount, [accounts[0], accounts[1]])
var bal1 = await sm.getBalance(1, accounts[1])
bal1.toString()    // → '-500000000000000000' (accounts[1] owes 0.5 ETH)
await sm.settle(1, accounts[0], { from: accounts[1], value: web3.utils.toWei("0.5", "ether") })
await sm.isSettled(1, accounts[1])    // → true
```

---

## Network Configuration

`truffle-config.js`:
```javascript
networks: {
  development: {
    host: "127.0.0.1",
    port: 7545,       // Ganache CLI default
    network_id: "*",
  }
},
compilers: {
  solc: { version: "0.8.19" }
}
```

---

## What Is Built vs What Needs to Be Built

### ✅ Done (Experiment 7)
- [x] `ExpenseManager.sol` — groups, members, expenses, balance tracking
- [x] `SettlementManager.sol` — ETH settlement, isSettled, getNetBalance
- [x] Migration script for deployment
- [x] 10 comprehensive test cases (all passing)
- [x] Verified on local Ganache blockchain
- [x] Truffle console interactions working

### 🔜 Next — What Needs to Be Built

#### Additional Smart Contracts
- [ ] `TokenSplit.sol` — support ERC-20 token settlements (not just ETH)
- [ ] `GroupFactory.sol` — factory pattern for deploying individual group contracts
- [ ] `ChainSplitRegistry.sol` — global registry of all groups and their members
- [ ] `DisputeManager.sol` — handle disputes when members disagree on an expense

#### Frontend (React DApp)
- [ ] Connect wallet via MetaMask (Web3Modal / wagmi)
- [ ] Dashboard — show all groups user belongs to
- [ ] Group page — show members, expenses, balances
- [ ] Add Expense form — description, amount, select participants
- [ ] Settlement page — pay debt with one click (triggers ETH transfer)
- [ ] Transaction history — all on-chain activity for the group
- [ ] Real-time balance updates using contract events

#### Frontend Tech Stack (Recommended)
```
React + Vite
ethers.js v6     ← interact with contracts
wagmi            ← wallet connection hooks
RainbowKit       ← wallet UI
Tailwind CSS     ← styling
```

#### Testnet Deployment (Experiment 8)
- [ ] Deploy to Sepolia testnet via Remix + MetaMask
- [ ] Verify contracts on Sepolia Etherscan
- [ ] Get test ETH from Sepolia faucet

---

## Key Concepts for Understanding This Project

**Smart Contract:** A program deployed on the blockchain. Once deployed, it cannot be modified. It executes automatically when called. All state changes are recorded permanently on-chain.

**wei vs ETH:** ETH amounts in Solidity are always in wei. `1 ETH = 1,000,000,000,000,000,000 wei (1e18)`. This is why balances show as large numbers like `500000000000000000`.

**msg.sender:** In Solidity, `msg.sender` is the address that called the function. This is how the contract knows who is paying vs who owes.

**msg.value:** The amount of ETH sent with a transaction (in wei). Used in `settle()` to receive the actual payment.

**Inheritance:** `SettlementManager is ExpenseManager` means SettlementManager gets all of ExpenseManager's functions and state variables. Always interact through `SettlementManager` in console to use a single contract's storage for both expenses and settlements.

**Gas:** Every transaction on Ethereum costs gas (a small ETH fee). On Ganache this is fake ETH, on testnets/mainnet it's real.

---

## Experiment Context

- **Course:** Blockchain & Decentralized Applications (CBD)
- **Experiment:** 7 — Building a Web-based DApp using Truffle Suite
- **Case Study:** ChainSplit — Peer-to-peer group expense sharing
- **Aim:** Design, deploy and test at least 2 smart contracts for the proposed system
- **Status:** Smart contracts layer complete. Frontend and additional contracts are the next phase.

---

## Author

**Aditya Agrahari**
GitHub: [@aditya-debugs](https://github.com/aditya-debugs)
