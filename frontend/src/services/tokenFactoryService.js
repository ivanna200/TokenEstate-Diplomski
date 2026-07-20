import { ethers } from "ethers";
import TokenFactoryArtifact from "../contracts/abis/TokenFactory.json";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";

export function getTokenFactoryContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESSES.TokenFactory, TokenFactoryArtifact.abi, signerOrProvider);
}

export async function tokenizeProperty(signer, { propertyId, name, symbol, totalShares }) {
  const contract = getTokenFactoryContract(signer);
  const tx = await contract.tokenizeProperty(propertyId, name, symbol, totalShares);
  return tx.wait();
}

export async function getPropertyTokenAddress(provider, propertyId) {
  const contract = getTokenFactoryContract(provider);
  return contract.propertyTokenOf(propertyId);
}