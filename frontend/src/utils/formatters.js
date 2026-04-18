import { formatEther, parseEther } from "ethers";

export function formatBalance(weiValue) {
  if (weiValue === undefined || weiValue === null) return "0";
  try {
    const abs = weiValue < 0n ? -weiValue : weiValue;
    return parseFloat(formatEther(abs)).toFixed(4);
  } catch {
    return "0";
  }
}

export function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function balanceLabel(weiValue) {
  if (!weiValue || weiValue === 0n) return { text: "Settled", color: "text-green-400" };
  if (weiValue > 0n) return { text: `+${formatBalance(weiValue)} ETH owed to you`, color: "text-green-400" };
  return { text: `-${formatBalance(weiValue)} ETH you owe`, color: "text-red-400" };
}

export function toWei(ethAmount) {
  return parseEther(ethAmount.toString());
}
