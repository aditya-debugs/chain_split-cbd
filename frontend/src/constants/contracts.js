import artifact from '@contracts/SettlementManager.json'

// Picks the last deployed network automatically — no manual copy-paste needed.
const networks = artifact.networks
const latestNetworkId = Object.keys(networks).sort((a, b) => Number(b) - Number(a))[0]

export const SETTLEMENT_MANAGER_ADDRESS = networks[latestNetworkId]?.address

export const SETTLEMENT_MANAGER_ABI = [
  // ExpenseManager functions (inherited)
  "function groupCount() view returns (uint256)",
  "function expenseCount() view returns (uint256)",
  "function createGroup(string _name) returns (uint256)",
  "function addMember(uint256 _groupId, address _member)",
  "function addExpense(uint256 _groupId, string _description, uint256 _amount, address[] _participants, uint8 _category)",
  "function getMembers(uint256 _groupId) view returns (address[])",
  "function getBalance(uint256 _groupId, address _user) view returns (int256)",
  "function getGroupExpenses(uint256 _groupId) view returns (uint256[])",
  "function groups(uint256) view returns (uint256 id, string name, address admin)",
  "function expenses(uint256) view returns (uint256 id, string description, uint256 amount, address payer, bool settled, uint8 category)",
  // SettlementManager functions
  "function settle(uint256 _groupId, address _receiver) payable",
  "function isSettled(uint256 _groupId, address _user) view returns (bool)",
  "function getNetBalance(uint256 _groupId, address _user) view returns (string status, uint256 absAmount)",
  "function getAllBalances(uint256 _groupId) view returns (address[] members, int256[] memberBalances)",
  // Events
  "event GroupCreated(uint256 indexed groupId, string name, address indexed admin)",
  "event MemberAdded(uint256 indexed groupId, address indexed member)",
  "event ExpenseAdded(uint256 indexed expenseId, string description, uint256 amount, address indexed payer, address[] participants, uint8 category)",
  "event SettlementMade(uint256 indexed groupId, address indexed payer, address indexed receiver, uint256 amount)",
]
