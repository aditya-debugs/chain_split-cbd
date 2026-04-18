import { useState, useEffect } from "react";
import { formatEther } from "ethers";
import { shortenAddress, formatUSD } from "../utils/formatters";
import { getCategory } from "../constants/categories";

export default function ActivityFeed({ contract, groupId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || !groupId) return;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const gid = BigInt(groupId);
        
        // 1. Fetch group's own expense IDs list from contract
        const expenseIds = await contract.getGroupExpenses(gid);
        const expenseIdSet = new Set(expenseIds.map(id => id.toString()));

        // 2. Query events
        const memberAddedFilter = contract.filters.MemberAdded(gid);
        const expenseAddedFilter = contract.filters.ExpenseAdded(); 
        const settlementFilter = contract.filters.SettlementMade(gid);

        const [memberEvents, expenseEvents, settlementEvents] = await Promise.all([
          contract.queryFilter(memberAddedFilter, 0), // Start from block 0 for local
          contract.queryFilter(expenseAddedFilter, 0),
          contract.queryFilter(settlementFilter, 0)
        ]);

        const allActivities = [
          ...memberEvents.map(e => ({
            type: "MEMBER_ADDED",
            user: e.args.member,
            timestamp: Date.now(),
            hash: e.transactionHash
          })),
          // Filter expenses locally because the event doesn't have groupId
          ...expenseEvents
            .filter(e => expenseIdSet.has(e.args.expenseId.toString()))
            .map(e => ({
              type: "EXPENSE_ADDED",
              payer: e.args.payer,
              description: e.args.description,
              amount: e.args.amount,
              timestamp: Date.now(),
              hash: e.transactionHash
            })),
          ...settlementEvents.map(e => ({
            type: "SETTLEMENT",
            from: e.args.payer,
            to: e.args.receiver,
            amount: e.args.amount,
            timestamp: Date.now(),
            hash: e.transactionHash,
            category: Number(e.args.category)
          })),
        ].sort((a, b) => b.timestamp - a.timestamp);

        setActivities(allActivities);
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Listen for live events
    const refresh = () => fetchEvents();
    contract.on("MemberAdded", refresh);
    contract.on("ExpenseAdded", refresh);
    contract.on("SettlementMade", refresh);

    return () => {
      contract.off("MemberAdded", refresh);
      contract.off("ExpenseAdded", refresh);
      contract.off("SettlementMade", refresh);
    };
  }, [contract, groupId]);

  if (loading) return <div className="text-gray-500 text-sm animate-pulse">Loading activity...</div>;

  return (
    <div className="space-y-4">
      {activities.length === 0 && (
        <p className="text-gray-500 text-sm py-4">No recent activity found.</p>
      )}
      {activities.map((act, i) => (
        <div key={i} className="flex items-start gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 hover:bg-gray-800 transition-colors">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl shrink-0">
            {act.type === "MEMBER_ADDED" && "👤"}
            {act.type === "EXPENSE_ADDED" && getCategory(act.category).icon}
            {act.type === "SETTLEMENT" && "💸"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200">
              {act.type === "MEMBER_ADDED" && (
                <>New member <span className="text-white font-mono">{shortenAddress(act.user)}</span> joined</>
              )}
              {act.type === "EXPENSE_ADDED" && (
                <>
                  <span className="text-white font-mono">{shortenAddress(act.payer)}</span> added 
                  <span className="text-white font-semibold"> "{act.description}"</span>
                </>
              )}
              {act.type === "SETTLEMENT" && (
                <>
                  <span className="text-white font-mono">{shortenAddress(act.from)}</span> paid 
                  <span className="text-white font-mono"> {shortenAddress(act.to)}</span>
                </>
              )}
            </p>
            <div className="flex justify-between items-center mt-1">
               <span className="text-[10px] text-gray-500 uppercase tracking-wider">{act.type.replace("_", " ")}</span>
                {act.amount && (
                  <div className="text-right">
                    <p className="text-xs font-mono text-orange-400">
                      {parseFloat(formatEther(act.amount)).toFixed(4)} ETH
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      {formatUSD(act.amount)}
                    </p>
                  </div>
                )}
            </div>
          </div>
          <a 
            href={`https://etherscan.io/tx/${act.hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      ))}
    </div>
  );
}
