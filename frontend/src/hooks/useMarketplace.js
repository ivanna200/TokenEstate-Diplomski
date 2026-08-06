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
    } catch {
      setError("Ne mogu učitati oglase.");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Ucitavanje pri prvom prikazu; reload je zasticen sa useCallback.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload(); }, [reload]);

  return { listings, isLoading, error, reload };
}