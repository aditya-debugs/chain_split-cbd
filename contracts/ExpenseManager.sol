// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ExpenseManager {

    struct Expense {
        uint256 id;
        string description;
        uint256 amount;
        address payer;
        address[] participants;
        bool settled;
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

    event GroupCreated(uint256 groupId, string name, address admin);
    event MemberAdded(uint256 groupId, address member);
    event ExpenseAdded(uint256 expenseId, string description, uint256 amount, address payer);

    function createGroup(string memory _name) public returns (uint256) {
        groupCount++;
        Group storage g = groups[groupCount];
        g.id = groupCount;
        g.name = _name;
        g.admin = msg.sender;
        g.members.push(msg.sender);

        emit GroupCreated(groupCount, _name, msg.sender);
        return groupCount;
    }

    function addMember(uint256 _groupId, address _member) public {
        require(groups[_groupId].admin == msg.sender, "Only admin can add members");
        require(_member != address(0), "Invalid address");
        groups[_groupId].members.push(_member);
        emit MemberAdded(_groupId, _member);
    }

    function addExpense(
        uint256 _groupId,
        string memory _description,
        uint256 _amount,
        address[] memory _participants
    ) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(_participants.length > 0, "Need at least one participant");

        expenseCount++;
        Expense storage e = expenses[expenseCount];
        e.id = expenseCount;
        e.description = _description;
        e.amount = _amount;
        e.payer = msg.sender;
        e.participants = _participants;
        e.settled = false;

        groups[_groupId].expenseIds.push(expenseCount);

        uint256 share = _amount / _participants.length;

        for (uint256 i = 0; i < _participants.length; i++) {
            if (_participants[i] != msg.sender) {
                balances[_groupId][_participants[i]] -= int256(share);
                balances[_groupId][msg.sender] += int256(share);
            }
        }

        emit ExpenseAdded(expenseCount, _description, _amount, msg.sender);
    }

    function getMembers(uint256 _groupId) public view returns (address[] memory) {
        return groups[_groupId].members;
    }

    function getBalance(uint256 _groupId, address _user) public view returns (int256) {
        return balances[_groupId][_user];
    }

    function getGroupExpenses(uint256 _groupId) public view returns (uint256[] memory) {
        return groups[_groupId].expenseIds;
    }
}
