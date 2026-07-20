import { createContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { createProvider, createWalletFromPrivateKey } from "../services/providerService";
import { DEMO_ACCOUNTS } from "../config/network";

export const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [provider] = useState(() => createProvider());
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);

  const refreshBalance = useCallback(async (address) => {
    const rawBalance = await provider.getBalance(address);
    setBalance(ethers.formatEther(rawBalance));
  }, [provider]);

  useEffect(() => {
    async function connect() {
      try {
        setIsConnecting(true);
        setError(null);
        const account = DEMO_ACCOUNTS[selectedAccountIndex];
        const wallet = createWalletFromPrivateKey(account.privateKey, provider);
        setSigner(wallet);
        await refreshBalance(account.address);
      } catch (err) {
        setError("Ne mogu se povezati na lokalnu mrežu. Provjeri da li 'npx hardhat node' radi.");
      } finally {
        setIsConnecting(false);
      }
    }
    connect();
  }, [selectedAccountIndex, provider, refreshBalance]);

  const value = {
    provider,
    signer,
    account: DEMO_ACCOUNTS[selectedAccountIndex],
    accounts: DEMO_ACCOUNTS,
    selectedAccountIndex,
    setSelectedAccountIndex,
    balance,
    refreshBalance,
    isConnecting,
    error,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}