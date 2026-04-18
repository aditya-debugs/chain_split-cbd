import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatEther, parseEther } from "ethers";
import AddMemberModal from "../components/AddMemberModal";
import AddExpenseModal from "../components/AddExpenseModal";
import SettleModal from "../components/SettleModal";
import DebtGraph from "../components/DebtGraph";
import ActivityFeed from "../components/ActivityFeed";
import TxStatus from "../components/TxStatus";
import { shortenAddress, balanceLabel, formatUSD } from "../utils/formatters";
import { simplifyDebts, buildDebtGraph, weiToEthNumber } from "../utils/debtSimplification";
import { getCategory } from "../constants/categories";

export default function GroupPage({ contract, account, ethPrice }) {
  const { id } = useParams();
  const groupId = Number(id);
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [simplifiedTxs, setSimplifiedTxs] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);
  const [activeTab, setActiveTab] = useState("balances");

  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!contract) return;
    try {
      const g = await contract.groups(groupId);
      setGroup({ id: groupId, name: g.name, admin: g.admin });

      const _members = await contract.getMembers(groupId);
      setMembers(_members);

      const expenseIds = await contract.getGroupExpenses(groupId);
      const _expenses = await Promise.all(
        expenseIds.map(async (eid) => {
          const e = await contract.expenses(eid);
            return {
              id: Number(eid),
              description: e.description,
              amount: e.amount,
              payer: e.payer,
              settled: e.settled,
              category: Number(e.category),
            };
        })
      );
      setExpenses(_expenses);

      const { members: balMembers, memberBalances } = await contract.getAllBalances(groupId);
      const balData = balMembers.map((addr, i) => ({
        address: addr,
        balance: memberBalances[i],
        balanceEth: weiToEthNumber(memberBalances[i]),
      }));
      setBalances(balData);

      const simplified = simplifyDebts(balData.map((b) => ({ address: b.address, balance: b.balanceEth })));
      setSimplifiedTxs(simplified);
      setGraphData(buildDebtGraph(
        balData.map((b) => ({ address: b.address, balance: b.balanceEth })),
        simplified
      ));
    } catch (err) {
      console.error("Error fetching group:", err);
    }
  }, [contract, groupId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Live event listeners
  useEffect(() => {
    if (!contract) return;
    const refresh = () => fetchAll();
    contract.on("MemberAdded", refresh);
    contract.on("ExpenseAdded", refresh);
    contract.on("SettlementMade", refresh);
    return () => {
      contract.off("MemberAdded", refresh);
      contract.off("ExpenseAdded", refresh);
      contract.off("SettlementMade", refresh);
    };
  }, [contract, fetchAll]);

  const withTx = async (fn) => {
    setLoading(true);
    setTxStatus("pending");
    try {
      const tx = await fn();
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("success");
      await fetchAll();
    } catch (err) {
      console.error(err);
      setTxStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => setTxStatus(null), 4000);
    }
  };

  const handleAddMember = (gid, address) =>
    withTx(() => contract.addMember(gid, address)).then(() => setShowAddMember(false));

  const handleAddExpense = (gid, desc, amountEth, participants, category) =>
    withTx(() =>
      contract.addExpense(gid, desc, parseEther(amountEth), participants, category)
    ).then(() => setShowAddExpense(false));

  const handleSettle = (gid, receiver, amountEth) =>
    withTx(() =>
      contract.settle(gid, receiver, { value: parseEther(amountEth) })
    ).then(() => setSettleTarget(null));

  const isAdmin = group?.admin?.toLowerCase() === account?.toLowerCase();
  const myBalance = balances.find((b) => b.address.toLowerCase() === account?.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{group?.name ?? "Loading..."}</h1>
          <p className="text-gray-400 text-sm mt-0.5">Group #{groupId} · {members.length} members</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddMember(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Add Member
          </button>
        )}
        <button
          onClick={() => setShowAddExpense(true)}
          disabled={!account}
          className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-xl transition-all"
        >
          + Add Expense
        </button>
      </div>

      {txStatus && <TxStatus status={txStatus} hash={txHash} />}

      {/* My balance banner */}
      {myBalance && (
        <div className={`rounded-xl p-4 border ${
          myBalance.balance > 0n
            ? "bg-green-900/20 border-green-700/40"
            : myBalance.balance < 0n
            ? "bg-red-900/20 border-red-700/40"
            : "bg-gray-800 border-gray-700"
        }`}>
          <p className="text-sm text-gray-400">Your balance in this group</p>
          <p className={`text-2xl font-bold mt-1 ${balanceLabel(myBalance.balance).color}`}>
            {balanceLabel(myBalance.balance).text}
            <span className="text-sm font-normal opacity-60 ml-3">
              (~{formatUSD(myBalance.balance, ethPrice)})
            </span>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1 w-fit overflow-x-auto">
        {["balances", "expenses", "simplify", "graph", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${
              activeTab === tab
                ? "bg-orange-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Balances */}
      {activeTab === "balances" && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Member Balances</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {balances.length === 0 && (
              <p className="px-5 py-8 text-center text-gray-500 text-sm">No balances yet. Add an expense.</p>
            )}
            {balances.map((b) => {
              const label = balanceLabel(b.balance);
              const isMe = b.address.toLowerCase() === account?.toLowerCase();
              const iOweThem = b.balance > 0n && myBalance?.balance < 0n;
              return (
                <div key={b.address} className="flex items-center px-5 py-4 gap-4">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-white">
                      {shortenAddress(b.address)}
                      {isMe && <span className="text-orange-400 text-xs ml-2">(you)</span>}
                    </p>
                    <p className={`text-sm mt-0.5 ${label.color}`}>
                      {label.text}
                      <span className="opacity-60 ml-2">({formatUSD(b.balance, ethPrice)})</span>
                    </p>
                  </div>
                  {!isMe && iOweThem && (
                    <button
                      onClick={() => setSettleTarget(b)}
                      className="text-xs bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 border border-orange-500/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Settle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Expenses */}
      {activeTab === "expenses" && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Expense History</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {expenses.length === 0 && (
              <p className="px-5 py-8 text-center text-gray-500 text-sm">No expenses yet.</p>
            )}
            {expenses.map((e) => (
              <div key={e.id} className="px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl">
                    {getCategory(e.category).icon}
                  </div>
                  <div>
                    <p className="text-white font-medium">{e.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Paid by {shortenAddress(e.payer)} · {getCategory(e.category).label}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-semibold font-mono">
                    {parseFloat(formatEther(e.amount)).toFixed(4)} ETH
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {formatUSD(e.amount, ethPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Simplify */}
      {activeTab === "simplify" && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Simplified Settlements</h2>
            <p className="text-xs text-gray-400 mt-1">
              Minimum transactions needed to settle all debts
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {simplifiedTxs.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-6">
                All debts are settled! 🎉
              </p>
            )}
            {simplifiedTxs.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3"
              >
                <span className="font-mono text-sm text-red-400">{shortenAddress(tx.from)}</span>
                <span className="text-orange-400">→</span>
                <span className="font-mono text-sm text-green-400">{shortenAddress(tx.to)}</span>
                <span className="ml-auto text-white font-semibold font-mono text-sm">
                  {tx.amount.toFixed(6)} ETH
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Graph */}
      {activeTab === "graph" && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-1">Debt Graph</h2>
          <p className="text-xs text-gray-400 mb-4">
            Visual representation of who owes whom. Drag nodes to rearrange.
          </p>
          <DebtGraph nodes={graphData.nodes} links={graphData.links} />
        </div>
      )}

      {/* Tab: Activity */}
      {activeTab === "activity" && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden min-h-[400px]">
          <div className="px-5 py-4 border-b border-gray-700 bg-gray-900/50">
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <p className="text-xs text-gray-400 mt-1">Live updates from the blockchain</p>
          </div>
          <div className="p-5">
            <ActivityFeed contract={contract} groupId={groupId} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddMember && (
        <AddMemberModal
          groupId={groupId}
          onClose={() => setShowAddMember(false)}
          onSubmit={handleAddMember}
          loading={loading}
        />
      )}
      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          members={members}
          account={account}
          ethPrice={ethPrice}
          onClose={() => setShowAddExpense(false)}
          onSubmit={handleAddExpense}
          loading={loading}
        />
      )}
      {settleTarget && (
        <SettleModal
          groupId={groupId}
          receiver={settleTarget.address}
          debtWei={myBalance?.balance ?? 0n}
          onClose={() => setSettleTarget(null)}
          onSubmit={handleSettle}
          loading={loading}
        />
      )}
    </div>
  );
}
