import { useMarketplace } from "../hooks/useMarketplace";
import { ListingCard } from "../components/ListingCard";

export function MarketplacePage() {
  const { listings, isLoading, error, reload } = useMarketplace();

  return (
    <div>
      <h2 className="section-title">Marketplace</h2>
      {isLoading && <p className="muted">Učitavanje oglasa...</p>}
      {error && <p className="error-text">{error}</p>}
      {!isLoading && !error && (
        <div className="listing-grid">
          {listings.map((l) => (
            <ListingCard key={l.listingId} listing={l} onChanged={reload} />
          ))}
        </div>
      )}
      {!isLoading && !error && listings.length === 0 && (
        <p className="muted">Trenutno nema aktivnih oglasa.</p>
      )}
    </div>
  );
}