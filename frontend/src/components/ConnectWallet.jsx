import { shortenAddress } from "../utils/formatters";

export default function ConnectWallet({ account, chainId, onConnect, onDisconnect, error }) {
  const isLocalNetwork = chainId === 1337 || chainId === 5777;

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-red-400 text-sm">{error}</span>}

      {!isLocalNetwork && account && (
        <span className="text-yellow-400 text-xs bg-yellow-900/30 px-2 py-1 rounded">
          Switch to Ganache (1337)
        </span>
      )}

      {account ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300 font-mono">{shortenAddress(account)}</span>
          <button
            onClick={onDisconnect}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
        >
          <span>🦊</span> Connect MetaMask
        </button>
      )}
    </div>
  );
}
