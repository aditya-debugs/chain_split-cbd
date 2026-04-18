const ExpenseManager = artifacts.require("ExpenseManager");
const SettlementManager = artifacts.require("SettlementManager");

module.exports = function (deployer) {
  deployer.deploy(ExpenseManager).then(() => {
    return deployer.deploy(SettlementManager);
  });
};
