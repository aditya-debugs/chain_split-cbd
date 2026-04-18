import { useState, useEffect, useCallback } from "react";
import { BrowserProvider } from "ethers";

export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask not found. Please install it.");
        return;
      }
      const _provider = new BrowserProvider(window.ethereum);
      const accounts = await _provider.send("eth_requestAccounts", []);
      const _signer = await _provider.getSigner();
      const network = await _provider.getNetwork();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
  }, []);

  // Auto-reconnect if already authorized
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) connect();
      });

      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) disconnect();
        else connect();
      });

      window.ethereum.on("chainChanged", () => connect());
    }
  }, [connect, disconnect]);

  return { provider, signer, account, chainId, connect, disconnect, error };
}
