import { ethers } from "ethers";
import { formatEth } from "../utils/format";

export function PropertyCard({ property, onSelect }) {
  return (
    <button className="property-card" onClick={() => onSelect(property.tokenId)}>
      <div className="property-card__id">#{property.tokenId}</div>
      <h3 className="property-card__location">{property.location}</h3>
      <div className="property-card__valuation">
        {formatEth(ethers.formatEther(property.valuationInWei))} ETH
      </div>
      <span className={`property-card__status ${property.isTokenized ? "is-tokenized" : "is-pending"}`}>
        {property.isTokenized ? "Tokenizovano" : "Nije tokenizovano"}
      </span>
    </button>
  );
}