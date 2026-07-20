import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { purchaseListing } from "../services/marketplaceService";

export function ListingCard({ listing, onPurchased }) {
  const { signer } = useWallet();

  async function handleBuy() {
    try {
      await purchaseListing(signer, listing.listingId, listing.amount, listing.pricePerToken);
      onPurchased();
    } catch (err) {
      alert("Kupovina nije uspjela: " + err.message);
    }
  }

  return (
    <div className="listing-card">
      <div className="listing-card__row">
        <span>Oglas #{listing.listingId}</span>
        <span>{listing.amount.toString()} udjela</span>
      </div>
      <div className="listing-card__row listing-card__price">
        {ethers.formatEther(listing.pricePerToken)} ETH / udio
      </div>
      <div className="listing-card__seller">
        Prodavac: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
      </div>
      <button className="btn-primary" onClick={handleBuy}>Kupi</button>
    </div>
  );
}