// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ExpenseManager.sol";

contract SettlementManager is ExpenseManager {

    event SettlementMade(
        uint256 indexed groupId,
        address indexed payer,
        address indexed receiver,
        uint256 amount
    );

    // Validate sender owes, receiver is owed, amount doesn't exceed debt
    function settle(uint256 _groupId, address payable _receiver) public payable {
        require(msg.value > 0, "Send ETH to settle");
        require(_receiver != address(0), "Invalid receiver");
        require(_receiver != msg.sender, "Cannot settle with yourself");

        int256 senderBal = balances[_groupId][msg.sender];
        int256 receiverBal = balances[_groupId][_receiver];

        require(senderBal < 0, "You don't owe anything in this group");
        require(receiverBal > 0, "Receiver is not owed anything in this group");

        // msg.value must not exceed sender's actual debt
        uint256 debt = uint256(-senderBal);
        require(msg.value <= debt, "Payment exceeds your debt");

        balances[_groupId][msg.sender] += int256(msg.value);
        balances[_groupId][_receiver] -= int256(msg.value);

        _receiver.transfer(msg.value);

        emit SettlementMade(_groupId, msg.sender, _receiver, msg.value);
    }

    function isSettled(uint256 _groupId, address _user) public view returns (bool) {
        return balances[_groupId][_user] == 0;
    }

    function getNetBalance(uint256 _groupId, address _user)
        public
        view
        returns (string memory status, uint256 absAmount)
    {
        int256 bal = balances[_groupId][_user];
        if (bal > 0) {
            return ("You are owed", uint256(bal));
        } else if (bal < 0) {
            return ("You owe", uint256(-bal));
        } else {
            return ("Settled", 0);
        }
    }

    // Returns all balances for all members in a group — used by frontend for debt graph
    function getAllBalances(uint256 _groupId)
        public
        view
        returns (address[] memory members, int256[] memory memberBalances)
    {
        address[] memory _members = groups[_groupId].members;
        int256[] memory _balances = new int256[](_members.length);
        for (uint256 i = 0; i < _members.length; i++) {
            _balances[i] = balances[_groupId][_members[i]];
        }
        return (_members, _balances);
    }
}
