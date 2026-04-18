import { useMemo } from "react";
import { Contract, BrowserProvider } from "ethers";
import { SETTLEMENT_MANAGER_ADDRESS, SETTLEMENT_MANAGER_ABI } from "../constants/contracts";

// Read-only contract (no wallet needed)
export function useReadContract() {
  return useMemo(() => {
    if (!window.ethereum) return null;
    const provider = new BrowserProvider(window.ethereum);
    return new Contract(SETTLEMENT_MANAGER_ADDRESS, SETTLEMENT_MANAGER_ABI, provider);
  }, []);
}

// Write contract (needs signer from MetaMask)
export function useWriteContract(signer) {
  return useMemo(() => {
    if (!signer) return null;
    return new Contract(SETTLEMENT_MANAGER_ADDRESS, SETTLEMENT_MANAGER_ABI, signer);
  }, [signer]);
}
