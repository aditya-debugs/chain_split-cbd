// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ExpenseManager {

    struct Expense {
        uint256 id;
        string description;
        uint256 amount;
        address payer;
        bool settled;
        uint8 category;
    }

    struct Group {
        uint256 id;
        string name;
        address admin;
        address[] members;
        uint256[] expenseIds;
    }

    uint256 public groupCount;
    uint256 public expenseCount;

    mapping(uint256 => Group) public groups;
    mapping(uint256 => Expense) public expenses;
    mapping(uint256 => mapping(address => int256)) public balances;

    event GroupCreated(uint256 indexed groupId, string name, address indexed admin);
    event MemberAdded(uint256 indexed groupId, address indexed member);
    event ExpenseAdded(uint256 indexed expenseId, string description, uint256 amount, address indexed payer, address[] participants, uint8 category);

    function createGroup(string calldata _name) external returns (uint256) {
        uint256 newGroupId = ++groupCount;
        Group storage g = groups[newGroupId];
        g.id = newGroupId;
        g.name = _name;
        g.admin = msg.sender;
        g.members.push(msg.sender);

        emit GroupCreated(newGroupId, _name, msg.sender);
        return newGroupId;
    }

    function addMember(uint256 _groupId, address _member) external {
        require(groups[_groupId].admin == msg.sender, "Only admin can add members");
        require(_member != address(0), "Invalid address");
        groups[_groupId].members.push(_member);
        emit MemberAdded(_groupId, _member);
    }

    function addExpense(
        uint256 _groupId,
        string calldata _description,
        uint256 _amount,
        address[] calldata _participants,
        uint8 _category
    ) external {
        require(_amount > 0, "Amount must be greater than 0");
        uint256 pCount = _participants.length;
        require(pCount > 0, "Need at least one participant");

        uint256 newExpenseId = ++expenseCount;
        Expense storage e = expenses[newExpenseId];
        e.id = newExpenseId;
        e.description = _description;
        e.amount = _amount;
        e.payer = msg.sender;
        e.settled = false;
        e.category = _category;

        groups[_groupId].expenseIds.push(newExpenseId);

        uint256 share = _amount / pCount;
        int256 iShare = int256(share);

        for (uint256 i = 0; i < pCount;) {
            address participant = _participants[i];
            if (participant != msg.sender) {
                balances[_groupId][participant] -= iShare;
                balances[_groupId][msg.sender] += iShare;
            }
            unchecked { ++i; }
        }

        emit ExpenseAdded(newExpenseId, _description, _amount, msg.sender, _participants, _category);
    }

    function getMembers(uint256 _groupId) external view returns (address[] memory) {
        return groups[_groupId].members;
    }

    function getBalance(uint256 _groupId, address _user) external view returns (int256) {
        return balances[_groupId][_user];
    }

    function getGroupExpenses(uint256 _groupId) external view returns (uint256[] memory) {
        return groups[_groupId].expenseIds;
    }
}
