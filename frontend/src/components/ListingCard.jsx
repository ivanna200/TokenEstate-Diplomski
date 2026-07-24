import { useState, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { purchaseListing, cancelListing } from "../services/marketplaceService";
import { shortenAddress, formatEth } from "../utils/format";
import { opisiGresku } from "../utils/errors";

export function ListingCard({ listing, onChanged }) {
  const { signer, account } = useWallet();
  const { showToast } = useToast();
  const [uToku, setUToku] = useState(null);
  const isSubmittingRef = useRef(false);

  const jeMojOglas =
    listing.seller.toLowerCase() === account.address.toLowerCase();

  async function handleBuy() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setUToku("kupovina");
    try {
      await purchaseListing(signer, listing.listingId, listing.amount, listing.pricePerToken);
      onChanged();
      showToast("Kupovina je uspješno završena.", "success");
    } catch (err) {
      showToast(opisiGresku(err), "error");
    } finally {
      setUToku(null);
      isSubmittingRef.current = false;
    }
  }

  async function handleCancel() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setUToku("otkazivanje");
    try {
      await cancelListing(signer, listing.listingId);
      onChanged();
      showToast("Oglas je otkazan.", "success");
    } catch (err) {
      showToast(opisiGresku(err), "error");
    } finally {
      setUToku(null);
      isSubmittingRef.current = false;
    }
  }

  const ukupnaCijena = BigInt(listing.amount) * BigInt(listing.pricePerToken);

  return (
    <div className="listing-card">
      <div className="listing-card__row">
        <span>Oglas #{listing.listingId}</span>
        <span>{listing.amount.toString()} udjela</span>
      </div>
      <div className="listing-card__row listing-card__price">
        {formatEth(ethers.formatEther(listing.pricePerToken))} ETH / udio
      </div>
      <div className="listing-card__total">
        Ukupno: {formatEth(ethers.formatEther(ukupnaCijena))} ETH
      </div>
      <div className="listing-card__seller">
        Prodavac: {jeMojOglas ? "vi" : shortenAddress(listing.seller)}
      </div>

      {jeMojOglas ? (
        <button
          className="btn-secondary"
          onClick={handleCancel}
          disabled={uToku !== null}
        >
          {uToku === "otkazivanje" ? "Otkazivanje..." : "Otkaži oglas"}
        </button>
      ) : (
        <button className="btn-primary" onClick={handleBuy} disabled={uToku !== null}>
          {uToku === "kupovina" ? "Kupovina u toku..." : "Kupi"}
        </button>
      )}
    </div>
  );
}