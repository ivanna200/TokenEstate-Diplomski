import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet mora biti korišten unutar WalletProvider-a");
  }
  return context;
}