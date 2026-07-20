import { useState, useEffect, useCallback } from "react";
import { useWallet } from "./useWallet";
import { fetchActiveListings } from "../services/marketplaceService";

export function useMarketplace() {
  const { provider } = useWallet();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setListings(await fetchActiveListings(provider));
    } catch (err) {
      setError("Ne mogu učitati oglase.");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  useEffect(() => { reload(); }, [reload]);

  return { listings, isLoading, error, reload };
}