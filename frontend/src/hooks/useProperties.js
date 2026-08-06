import { useState, useEffect, useCallback } from "react";
import { useWallet } from "./useWallet";
import { fetchAllProperties } from "../services/propertyNFTService";

export function useProperties() {
  const { provider } = useWallet();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProperties(await fetchAllProperties(provider));
    } catch {
      setError("Ne mogu učitati nekretnine.");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Ucitavanje pri prvom prikazu; reload je zasticen sa useCallback.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload(); }, [reload]);

  return { properties, isLoading, error, reload };
}