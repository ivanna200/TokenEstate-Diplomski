import { ethers } from "ethers";
import { LOCAL_RPC_URL } from "../config/network";

/**
 * Kreira konekciju (provider) ka lokalnoj Hardhat mreži.
 * Čist JavaScript - ne zna ništa o React komponentama ili stanju.
 */
export function createProvider() {
  return new ethers.JsonRpcProvider(LOCAL_RPC_URL);
}

/**
 * Kreira "wallet" (potpisnika transakcija) na osnovu privatnog ključa demo naloga.
 */
export function createWalletFromPrivateKey(privateKey, provider) {
  return new ethers.Wallet(privateKey, provider);
}