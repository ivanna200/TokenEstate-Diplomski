import { ethers } from "ethers";
import MarketplaceArtifact from "../contracts/abis/Marketplace.json";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";

export function getMarketplaceContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESSES.Marketplace, MarketplaceArtifact.abi, signerOrProvider);
}

// overrides (npr. { nonce: 6 }) - vidi napomenu u propertyTokenService.js.
// Neophodno da se izbjegne "nonce too low" greska kada createListing ide
// odmah nakon approve transakcije u istom korisnickom toku.
export async function createListing(signer, { tokenAddress, amount, pricePerTokenInEth }, overrides = {}) {
  const contract = getMarketplaceContract(signer);
  const pricePerToken = ethers.parseEther(String(pricePerTokenInEth));
  const tx = await contract.createListing(tokenAddress, amount, pricePerToken, overrides);
  return tx.wait();
}

export async function purchaseListing(signer, listingId, amount, pricePerToken) {
  const contract = getMarketplaceContract(signer);
  const totalPrice = BigInt(amount) * BigInt(pricePerToken);
  const tx = await contract.purchase(listingId, amount, { value: totalPrice });
  return tx.wait();
}

export async function cancelListing(signer, listingId) {
  const contract = getMarketplaceContract(signer);
  const tx = await contract.cancelListing(listingId);
  return tx.wait();
}

export async function fetchActiveListings(provider) {
  const contract = getMarketplaceContract(provider);
  const listedEvents = await contract.queryFilter(contract.filters.Listed());

  const listings = await Promise.all(
    listedEvents.map(async (event) => {
      const listingId = event.args.listingId;
      const data = await contract.listings(listingId);
      return {
        listingId: listingId.toString(),
        seller: data.seller,
        tokenAddress: data.tokenAddress,
        amount: data.amount,
        pricePerToken: data.pricePerToken,
        active: data.active,
      };
    })
  );

  return listings.filter((l) => l.active);
}