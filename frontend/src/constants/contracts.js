// After running `truffle migrate --reset`, copy the deployed addresses here.
// Also copy ABIs from build/contracts/*.json → the "abi" field.

export const SETTLEMENT_MANAGER_ADDRESS = "0x3Dc73601FeCa05871F0AeeF0C74332691A2c4306";

export const SETTLEMENT_MANAGER_ABI = [
  // ExpenseManager functions (inherited)
  "function groupCount() view returns (uint256)",
  "function expenseCount() view returns (uint256)",
  "function createGroup(string name) returns (uint256)",
  "function addMember(uint256 groupId, address member)",
  "function addExpense(uint256 groupId, string description, uint256 amount, address[] participants)",
  "function getMembers(uint256 groupId) view returns (address[])",
  "function getBalance(uint256 groupId, address user) view returns (int256)",
  "function getGroupExpenses(uint256 groupId) view returns (uint256[])",
  "function groups(uint256) view returns (uint256 id, string name, address admin)",
  "function expenses(uint256) view returns (uint256 id, string description, uint256 amount, address payer, bool settled)",
  // SettlementManager functions
  "function settle(uint256 groupId, address receiver) payable",
  "function isSettled(uint256 groupId, address user) view returns (bool)",
  "function getNetBalance(uint256 groupId, address user) view returns (string status, uint256 absAmount)",
  "function getAllBalances(uint256 groupId) view returns (address[] members, int256[] memberBalances)",
  // Events
  "event GroupCreated(uint256 groupId, string name, address admin)",
  "event MemberAdded(uint256 groupId, address member)",
  "event ExpenseAdded(uint256 expenseId, string description, uint256 amount, address payer)",
  "event SettlementMade(uint256 indexed groupId, address indexed payer, address indexed receiver, uint256 amount)",
];
