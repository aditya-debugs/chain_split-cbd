import { useState } from "react";
import { formatEther } from "ethers";
import { shortenAddress } from "../utils/formatters";

export default function AddExpenseModal({ groupId, members, account, onClose, onSubmit, loading }) {
  const [description, setDescription] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState(
    members.map((m) => m.toLowerCase())
  );

  const toggleParticipant = (addr) => {
    const lower = addr.toLowerCase();
    setSelectedParticipants((prev) =>
      prev.includes(lower) ? prev.filter((a) => a !== lower) : [...prev, lower]
    );
  };

  const perPersonEth =
    amountEth && selectedParticipants.length > 0
      ? (parseFloat(amountEth) / selectedParticipants.length).toFixed(6)
      : "0";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amountEth || selectedParticipants.length === 0) return;
    onSubmit(groupId, description, amountEth, selectedParticipants);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Add Expense</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner, Hotel booking..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Split with ({selectedParticipants.length} selected)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {members.map((addr) => (
                <label
                  key={addr}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(addr.toLowerCase())}
                    onChange={() => toggleParticipant(addr)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <span className="font-mono text-sm text-gray-300">
                    {shortenAddress(addr)}
                    {addr.toLowerCase() === account?.toLowerCase() && (
                      <span className="text-orange-400 text-xs ml-2">(you)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {amountEth && selectedParticipants.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 text-sm text-orange-300">
              Each person pays: <strong>{perPersonEth} ETH</strong>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !description || !amountEth || selectedParticipants.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-all duration-200"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}
