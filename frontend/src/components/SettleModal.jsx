import { useState } from "react";
import { formatEther } from "ethers";
import { shortenAddress } from "../utils/formatters";

export default function SettleModal({ groupId, receiver, debtWei, onClose, onSubmit, loading }) {
  const maxEth = parseFloat(formatEther(debtWei < 0n ? -debtWei : debtWei));
  const [amountEth, setAmountEth] = useState(maxEth.toFixed(6));

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amountEth);
    if (!val || val <= 0 || val > maxEth) return;
    onSubmit(groupId, receiver, amountEth);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Settle Debt</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Paying to</span>
            <span className="font-mono text-white">{shortenAddress(receiver)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Total debt</span>
            <span className="text-red-400 font-semibold">{maxEth.toFixed(6)} ETH</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount to Pay (ETH)</label>
            <input
              type="number"
              step="0.000001"
              min="0.000001"
              max={maxEth}
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Max: {maxEth.toFixed(6)} ETH</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-all duration-200"
          >
            {loading ? "Sending ETH..." : `Pay ${parseFloat(amountEth).toFixed(6)} ETH`}
          </button>
        </form>
      </div>
    </div>
  );
}
