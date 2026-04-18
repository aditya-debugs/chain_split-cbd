import { useState } from "react";
import { isAddress } from "ethers";

export default function AddMemberModal({ groupId, onClose, onSubmit, loading }) {
  const [address, setAddress] = useState("");
  const [addrError, setAddrError] = useState("");

  const validate = (val) => {
    if (!isAddress(val)) setAddrError("Invalid Ethereum address");
    else setAddrError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAddress(address)) return;
    onSubmit(groupId, address);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white">Add Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); validate(e.target.value); }}
              placeholder="0x..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {addrError && <p className="text-red-400 text-xs mt-1">{addrError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !!addrError || !address}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-all duration-200"
          >
            {loading ? "Adding..." : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}
