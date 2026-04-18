import { useState, useEffect } from "react";

export function useEthPrice() {
  const [price, setPrice] = useState(3500); // Default fallback
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await response.json();
        if (data.ethereum?.usd) {
          setPrice(data.ethereum.usd);
          console.log("Live ETH Price Synced:", data.ethereum.usd);
        }
      } catch (err) {
        console.warn("Could not fetch live price, using fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { price, loading };
}
