import { useState, useRef } from "react";
import { useWallet } from "../hooks/useWallet";
import { useProperties } from "../hooks/useProperties";
import { useToast } from "../hooks/useToast";
import { PropertyCard } from "../components/PropertyCard";
import { mintProperty } from "../services/propertyNFTService";

export function HomePage({ onSelectProperty }) {
  const { signer, account } = useWallet();
  const { properties, isLoading, error, reload } = useProperties();
  const { showToast } = useToast();
  const [form, setForm] = useState({ location: "", valuationInEth: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const isAdmin = account.label === "Administrator platforme";

  async function handleMint(e) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
      showToast("Nekretnina je uspješno registrovana.", "success");
    } catch (err) {
      showToast("Registracija nije uspjela: " + extractErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
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
              disabled={isSubmitting}
              required
            />
            <input
              placeholder="Procijenjena vrijednost (ETH)"
              type="number" step="0.01" min="0"
              value={form.valuationInEth}
              onChange={(e) => setForm({ ...form, valuationInEth: e.target.value })}
              disabled={isSubmitting}
              required
            />
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registracija u toku..." : "Registruj"}
            </button>
          </div>
        </form>
      )}

      <h2 className="section-title">Nekretnine</h2>
      {isLoading && <p className="muted">Učitavanje nekretnina...</p>}
      {error && <p className="error-text">{error}</p>}
      {!isLoading && !error && (
        <div className="property-grid">
          {properties.map((p) => (
            <PropertyCard key={p.tokenId} property={p} onSelect={onSelectProperty} />
          ))}
        </div>
      )}
      {!isLoading && !error && properties.length === 0 && (
        <p className="muted">Još nema registrovanih nekretnina. Ako si administrator, registruj prvu iznad.</p>
      )}
    </div>
  );
}

function extractErrorMessage(err) {
  if (err?.reason) return err.reason;
  if (err?.shortMessage) return err.shortMessage;
  return err?.message ?? "Nepoznata greška.";
}