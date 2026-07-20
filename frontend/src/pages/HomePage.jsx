import { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useProperties } from "../hooks/useProperties";
import { PropertyCard } from "../components/PropertyCard";
import { mintProperty } from "../services/propertyNFTService";

export function HomePage({ onSelectProperty }) {
  const { signer, account } = useWallet();
  const { properties, isLoading, error, reload } = useProperties();
  const [form, setForm] = useState({ location: "", valuationInEth: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = account.label === "Administrator platforme";

  async function handleMint(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await mintProperty(signer, {
        to: account.address,
        location: form.location,
        valuationInEth: form.valuationInEth,
        metadataURI: "ipfs://demo",
      });
      setForm({ location: "", valuationInEth: "" });
      await reload();
    } catch (err) {
      alert("Kreiranje nekretnine nije uspjelo: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {isAdmin && (
        <form className="mint-form" onSubmit={handleMint}>
          <h2 className="section-title">Registruj novu nekretninu</h2>
          <div className="mint-form__row">
            <input
              placeholder="Lokacija (npr. Banja Luka, Centar)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
            <input
              placeholder="Procijenjena vrijednost (ETH)"
              type="number" step="0.01"
              value={form.valuationInEth}
              onChange={(e) => setForm({ ...form, valuationInEth: e.target.value })}
              required
            />
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kreiranje..." : "Registruj"}
            </button>
          </div>
        </form>
      )}

      <h2 className="section-title">Nekretnine</h2>
      {isLoading && <p className="muted">Učitavanje...</p>}
      {error && <p className="error-text">{error}</p>}
      <div className="property-grid">
        {properties.map((p) => (
          <PropertyCard key={p.tokenId} property={p} onSelect={onSelectProperty} />
        ))}
      </div>
      {!isLoading && properties.length === 0 && (
        <p className="muted">Još nema registrovanih nekretnina.</p>
      )}
    </div>
  );
}