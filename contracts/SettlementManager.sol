// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ExpenseManager.sol";

contract SettlementManager is ExpenseManager {

    event SettlementMade(
        uint256 groupId,
        address indexed payer,
        address indexed receiver,
        uint256 amount
    );

    event BalanceCleared(uint256 groupId, address user);

    function settle(uint256 _groupId, address payable _receiver) public payable {
        require(msg.value > 0, "Send ETH to settle");
        require(_receiver != address(0), "Invalid receiver");
        require(_receiver != msg.sender, "Cannot settle with yourself");

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
}
