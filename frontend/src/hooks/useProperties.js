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
    } catch (err) {
      setError("Ne mogu učitati nekretnine.");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  useEffect(() => { reload(); }, [reload]);

  return { properties, isLoading, error, reload };
}