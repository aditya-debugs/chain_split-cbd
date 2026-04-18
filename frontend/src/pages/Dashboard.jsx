import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CreateGroupModal from "../components/CreateGroupModal";
import TxStatus from "../components/TxStatus";
import { parseEther } from "ethers";

export default function Dashboard({ contract, account }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const fetchGroups = useCallback(async () => {
    if (!contract) return;
    try {
      const count = await contract.groupCount();
      const total = Number(count);
      const fetched = [];
      for (let i = 1; i <= total; i++) {
        const g = await contract.groups(i);
        const members = await contract.getMembers(i);
        const isInGroup = members.some(
          (m) => m.toLowerCase() === account?.toLowerCase()
        );
        if (isInGroup) {
          fetched.push({ id: i, name: g.name, admin: g.admin, memberCount: members.length });
        }
      }
      setGroups(fetched);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Listen to GroupCreated event
  useEffect(() => {
    if (!contract) return;
    const handler = () => fetchGroups();
    contract.on("GroupCreated", handler);
    return () => contract.off("GroupCreated", handler);
  }, [contract, fetchGroups]);

  const handleCreateGroup = async (name) => {
    if (!contract) return;
    setLoading(true);
    setTxStatus("pending");
    try {
      const tx = await contract.createGroup(name);
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("success");
      setShowCreate(false);
      await fetchGroups();
    } catch (err) {
      console.error(err);
      setTxStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => setTxStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Your expense groups</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!account}
          className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
        >
          + New Group
        </button>
      </div>

      {txStatus && <TxStatus status={txStatus} hash={txHash} />}

      {!account && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-5 text-yellow-300 text-center">
          Connect your MetaMask wallet to view and manage your groups.
        </div>
      )}

      {account && groups.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">💸</div>
          <p className="text-lg">No groups yet.</p>
          <p className="text-sm mt-1">Create one to start splitting expenses.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g.id}
            onClick={() => navigate(`/group/${g.id}`)}
            className="bg-gray-900 border border-gray-700 hover:border-orange-500/60 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl">
                👥
              </div>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                #{g.id}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{g.name}</h3>
            <p className="text-sm text-gray-400">{g.memberCount} members</p>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateGroup}
          loading={loading}
        />
      )}
    </div>
  );
}
