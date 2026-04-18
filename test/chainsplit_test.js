const ExpenseManager = artifacts.require("ExpenseManager");
const SettlementManager = artifacts.require("SettlementManager");

contract("ChainSplit - Full Test Suite", (accounts) => {
  const admin = accounts[0];
  const member1 = accounts[1];
  const member2 = accounts[2];

  let expenseManager;
  let settlementManager;

  before(async () => {
    expenseManager = await ExpenseManager.deployed();
    settlementManager = await SettlementManager.deployed();
  });

  // TC1 — Group creation emits event
  it("TC1: Should create a group successfully", async () => {
    const tx = await expenseManager.createGroup("Trip to Goa", { from: admin });
    assert.equal(
      tx.logs[0].event,
      "GroupCreated",
      "GroupCreated event not emitted",
    );
  });

  // TC2 — Group counter increments
  it("TC2: Group count should be 1 after creation", async () => {
    const count = await expenseManager.groupCount();
    assert.equal(count.toNumber(), 1, "Group count mismatch");
  });

  // TC3 — Creator auto-added as first member
  it("TC3: Admin should be added as first member automatically", async () => {
    const members = await expenseManager.getMembers(1);
    assert.equal(members[0], admin, "Admin not set as first member");
  });

  // TC4 — Admin can add members
  it("TC4: Admin should be able to add a member to the group", async () => {
    await expenseManager.addMember(1, member1, { from: admin });
    const members = await expenseManager.getMembers(1);
    assert.include(members, member1, "member1 was not added to the group");
  });

  // TC5 — Access control: only admin can add members
  it("TC5: Non-admin should NOT be able to add a member", async () => {
    try {
      await expenseManager.addMember(1, member2, { from: member1 });
      assert.fail("Expected error was not thrown");
    } catch (err) {
      assert.include(err.message, "Only admin", "Wrong revert message");
    }
  });

  // TC6 — Expense is recorded correctly
  it("TC6: Should add an expense and record it", async () => {
    const amount = web3.utils.toWei("1", "ether");
    await expenseManager.addMember(1, member2, { from: admin });
    await expenseManager.addExpense(
      1,
      "Hotel booking",
      amount,
      [admin, member1, member2],
      { from: admin },
    );
    const expCount = await expenseManager.expenseCount();
    assert.equal(expCount.toNumber(), 1, "Expense was not recorded");
  });

  // TC7 — Non-payer gets negative balance (they owe)
  it("TC7: member1 balance should be negative after expense (owes money)", async () => {
    const balance = await expenseManager.getBalance(1, member1);
    // balance is returned as a signed int256 — negative values come back as large BN strings
    // A negative int256 returned via web3 will have its toString() start with '-'
    const balStr = balance.toString();
    assert.isTrue(
      balStr.startsWith("-"),
      "member1 should have a negative balance, got: " + balStr,
    );
  });

  // TC8 — Payer gets positive balance (is owed)
  it("TC8: Admin balance should be positive after expense (is owed money)", async () => {
    const balance = await expenseManager.getBalance(1, admin);
    const balBN = web3.utils.toBN(balance.toString());
    assert.isTrue(
      balBN.gtn(0),
      "Admin should have a positive balance, got: " + balance.toString(),
    );
  });

  // TC9 — Settlement transfers ETH and updates balance
  it("TC9: Settlement should transfer ETH and update balance", async () => {
    const balanceBefore = web3.utils.toBN(
      (await settlementManager.getBalance(1, member1)).toString(),
    );
    const payAmount = web3.utils.toWei("0.1", "ether");

    await settlementManager.settle(1, admin, {
      from: member1,
      value: payAmount,
    });

    const balanceAfter = web3.utils.toBN(
      (await settlementManager.getBalance(1, member1)).toString(),
    );
    assert.isTrue(
      balanceAfter.gt(balanceBefore),
      "Balance should increase (less negative) after settlement",
    );
  });

  // TC10 — getNetBalance returns correct status string
  it("TC10: getNetBalance should return a valid status string for admin", async () => {
    const result = await settlementManager.getNetBalance(1, admin);
    const validStatuses = ["You are owed", "Settled", "You owe"];
    assert.include(
      validStatuses,
      result.status,
      "Unexpected status: " + result.status,
    );
  });
});
