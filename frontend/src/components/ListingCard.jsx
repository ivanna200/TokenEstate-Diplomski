import { useState, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { purchaseListing } from "../services/marketplaceService";
import { shortenAddress, formatEth } from "../utils/format";

export function ListingCard({ listing, onPurchased }) {
  const { signer } = useWallet();
  const { showToast } = useToast();
  const [isBuying, setIsBuying] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleBuy() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsBuying(true);
    try {
      await purchaseListing(signer, listing.listingId, listing.amount, listing.pricePerToken);
      onPurchased();
      showToast("Kupovina je uspješno završena.", "success");
    } catch (err) {
      showToast("Kupovina nije uspjela: " + (err?.reason ?? err?.shortMessage ?? err.message), "error");
    } finally {
      setIsBuying(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <div className="listing-card">
      <div className="listing-card__row">
        <span>Oglas #{listing.listingId}</span>
        <span>{listing.amount.toString()} udjela</span>
      </div>
      <div className="listing-card__row listing-card__price">
        {formatEth(ethers.formatEther(listing.pricePerToken))} ETH / udio
      </div>
      <div className="listing-card__seller">
        Prodavac: {shortenAddress(listing.seller)}
      </div>
      <button className="btn-primary" onClick={handleBuy} disabled={isBuying}>
        {isBuying ? "Kupovina u toku..." : "Kupi"}
      </button>
    </div>
  );
}