import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useWallet } from "./hooks/useWallet";
import { useWriteContract, useReadContract } from "./hooks/useContract";
import ConnectWallet from "./components/ConnectWallet";
import Dashboard from "./pages/Dashboard";
import GroupPage from "./pages/GroupPage";

export default function App() {
  const { signer, account, chainId, connect, disconnect, error } = useWallet();
  const writeContract = useWriteContract(signer);
  const readContract = useReadContract();

  // Use write contract when wallet connected, fallback to read-only
  const contract = writeContract ?? readContract;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Navbar */}
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-sm">
                CS
              </div>
              <span className="text-xl font-bold text-white">ChainSplit</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full hidden sm:block">
                Decentralized Expense Sharing
              </span>
            </div>
            <ConnectWallet
              account={account}
              chainId={chainId}
              onConnect={connect}
              onDisconnect={disconnect}
              error={error}
            />
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          <Routes>
            <Route
              path="/"
              element={<Dashboard contract={contract} account={account} />}
            />
            <Route
              path="/group/:id"
              element={<GroupPage contract={contract} account={account} />}
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-16 py-6 text-center text-gray-600 text-xs">
          ChainSplit · CBD Experiment 7 · Built with Solidity + React + ethers.js
        </footer>
      </div>
    </BrowserRouter>
  );
}
