import { ethers } from "ethers";
import PropertyTokenArtifact from "../contracts/abis/PropertyToken.json";

export function getPropertyTokenContract(tokenAddress, signerOrProvider) {
  return new ethers.Contract(tokenAddress, PropertyTokenArtifact.abi, signerOrProvider);
}

export async function fetchTokenSummary(provider, tokenAddress, accountAddress) {
  const contract = getPropertyTokenContract(tokenAddress, provider);
  const [name, symbol, totalSupply, balance, earnings] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.totalSupply(),
    contract.balanceOf(accountAddress),
    contract.earningsOf(accountAddress),
  ]);
  return { name, symbol, totalSupply, balance, earnings };
}

export async function depositRevenue(signer, tokenAddress, amountInEth) {
  const contract = getPropertyTokenContract(tokenAddress, signer);
  const tx = await contract.depositRevenue({ value: ethers.parseEther(String(amountInEth)) });
  return tx.wait();
}

export async function withdrawEarnings(signer, tokenAddress) {
  const contract = getPropertyTokenContract(tokenAddress, signer);
  const tx = await contract.withdrawEarnings();
  return tx.wait();
}

// overrides (npr. { nonce: 5 }) - omogucava pozivaocu da eksplicitno zada nonce,
// sto je neophodno kada se ova funkcija poziva kao PRVA od dvije uzastopne
// transakcije istog naloga (vidi handleList u PropertyDetailsPage.jsx).
export async function approveMarketplace(signer, tokenAddress, marketplaceAddress, amount, overrides = {}) {
  const contract = getPropertyTokenContract(tokenAddress, signer);
  const tx = await contract.approve(marketplaceAddress, amount, overrides);
  return tx.wait();
}