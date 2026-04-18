/**
 * Debt Simplification Algorithm
 *
 * Problem: Given N people with net balances (positive = owed, negative = owes),
 * find the minimum number of transactions to settle all debts.
 *
 * Algorithm: Greedy — always match the largest debtor with the largest creditor.
 * This is O(n log n) and produces optimal or near-optimal results.
 *
 * Input:  Array of { address, balance } where balance is a JS number (not BigInt)
 * Output: Array of { from, to, amount } representing simplified transactions
 */

export function simplifyDebts(balances) {
  // Filter out zero balances — they're already settled
  const nonZero = balances
    .map((b) => ({ ...b }))
    .filter((b) => Math.abs(b.balance) > 0.0001);

  const creditors = nonZero
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance); // descending

  const debtors = nonZero
    .filter((b) => b.balance < 0)
    .sort((a, b) => a.balance - b.balance); // ascending (most negative first)

  const transactions = [];
  let ci = 0; // creditor index
  let di = 0; // debtor index

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    let amount = Math.min(creditor.balance, -debtor.balance);
    amount = parseFloat(amount.toFixed(6));

    if (amount > 0) {
      transactions.push({
        from: debtor.address,
        to: creditor.address,
        amount,
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount;

    if (Math.abs(creditor.balance) < 0.0001) ci++;
    if (Math.abs(debtor.balance) < 0.0001) di++;
  }

  return transactions;
}

/**
 * Build a debt graph for D3 visualization.
 * Returns: { nodes: [{id, label}], links: [{source, target, amount}] }
 */
export function buildDebtGraph(balances, simplifiedTransactions) {
  const addressSet = new Set();
  balances.forEach((b) => addressSet.add(b.address));

  const nodes = Array.from(addressSet).map((addr) => ({
    id: addr,
    label: shortenAddress(addr),
    balance: balances.find((b) => b.address === addr)?.balance ?? 0,
  }));

  const links = simplifiedTransactions.map((tx) => ({
    source: tx.from,
    target: tx.to,
    amount: tx.amount,
  }));

  return { nodes, links };
}

export function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Convert wei (BigInt or string) to ETH number for use in algorithms
 */
export function weiToEthNumber(wei) {
  return Number(wei) / 1e18;
}
