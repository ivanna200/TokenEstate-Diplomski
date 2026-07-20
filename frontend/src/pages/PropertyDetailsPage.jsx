import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { fetchProperty } from "../services/propertyNFTService";
import { tokenizeProperty, getPropertyTokenAddress } from "../services/tokenFactoryService";
import { fetchTokenSummary, depositRevenue, withdrawEarnings, approveMarketplace } from "../services/propertyTokenService";
import { createListing } from "../services/marketplaceService";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";

export function PropertyDetailsPage({ tokenId, onBack }) {
  const { provider, signer, account } = useWallet();
  const [property, setProperty] = useState(null);
  const [tokenAddress, setTokenAddress] = useState(null);
  const [tokenSummary, setTokenSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = account.label === "Administrator platforme";

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchProperty(provider, tokenId);
      setProperty(data);

      if (data.isTokenized) {
        const addr = await getPropertyTokenAddress(provider, tokenId);
        setTokenAddress(addr);
        setTokenSummary(await fetchTokenSummary(provider, addr, account.address));
      } else {
        setTokenAddress(null);
        setTokenSummary(null);
      }
    } catch (err) {
      setError("Ne mogu učitati nekretninu.");
    } finally {
      setIsLoading(false);
    }
  }, [provider, tokenId, account.address]);

  useEffect(() => { load(); }, [load]);

  const [tokenizeForm, setTokenizeForm] = useState({ name: "", symbol: "", totalShares: "1000" });
  async function handleTokenize(e) {
    e.preventDefault();
    try {
      await tokenizeProperty(signer, { propertyId: tokenId, ...tokenizeForm });
      await load();
    } catch (err) {
      alert("Tokenizacija nije uspjela: " + err.message);
    }
  }

  const [revenueAmount, setRevenueAmount] = useState("");
  async function handleDeposit(e) {
    e.preventDefault();
    try {
      await depositRevenue(signer, tokenAddress, revenueAmount);
      setRevenueAmount("");
      await load();
    } catch (err) {
      alert("Uplata prihoda nije uspjela: " + err.message);
    }
  }

  async function handleWithdraw() {
    try {
      await withdrawEarnings(signer, tokenAddress);
      await load();
    } catch (err) {
      alert("Povlačenje nije uspjelo: " + err.message);
    }
  }

  const [listForm, setListForm] = useState({ amount: "", price: "" });
  async function handleList(e) {
    e.preventDefault();
    try {
      await approveMarketplace(signer, tokenAddress, CONTRACT_ADDRESSES.Marketplace, listForm.amount);
      await createListing(signer, { tokenAddress, amount: listForm.amount, pricePerTokenInEth: listForm.price });
      setListForm({ amount: "", price: "" });
      alert("Oglas je kreiran.");
    } catch (err) {
      alert("Kreiranje oglasa nije uspjelo: " + err.message);
    }
  }

  if (isLoading) return <p className="muted">Učitavanje...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!property) return null;

  return (
    <div>
      <button className="btn-link" onClick={onBack}>← Nazad</button>
      <h2 className="section-title">Nekretnina #{property.tokenId}</h2>
      <p>{property.location}</p>
      <p className="muted">Procijenjena vrijednost: {ethers.formatEther(property.valuationInWei)} ETH</p>

      {!property.isTokenized && isAdmin && (
        <form className="mint-form" onSubmit={handleTokenize}>
          <h3 className="section-title">Tokenizuj nekretninu</h3>
          <div className="mint-form__row">
            <input placeholder="Naziv tokena" value={tokenizeForm.name}
              onChange={(e) => setTokenizeForm({ ...tokenizeForm, name: e.target.value })} required />
            <input placeholder="Simbol (npr. TEBL1)" value={tokenizeForm.symbol}
              onChange={(e) => setTokenizeForm({ ...tokenizeForm, symbol: e.target.value })} required />
            <input placeholder="Broj udjela" type="number" value={tokenizeForm.totalShares}
              onChange={(e) => setTokenizeForm({ ...tokenizeForm, totalShares: e.target.value })} required />
            <button className="btn-primary" type="submit">Tokenizuj</button>
          </div>
        </form>
      )}

      {property.isTokenized && tokenSummary && (
        <div className="token-panel">
          <h3 className="section-title">{tokenSummary.name} ({tokenSummary.symbol})</h3>
          <div className="token-stats">
            <div><span className="muted">Ukupno udjela</span><br />{tokenSummary.totalSupply.toString()}</div>
            <div><span className="muted">Tvoji udjeli</span><br />{tokenSummary.balance.toString()}</div>
            <div><span className="muted">Neisplaćeni prihod</span><br />{ethers.formatEther(tokenSummary.earnings)} ETH</div>
          </div>

          <button className="btn-primary" onClick={handleWithdraw} disabled={tokenSummary.earnings === 0n}>
            Povuci prihod
          </button>

          {isAdmin && (
            <form className="mint-form" onSubmit={handleDeposit}>
              <h4 className="section-title">Uplati prihod (npr. zakupninu)</h4>
              <div className="mint-form__row">
                <input placeholder="Iznos (ETH)" type="number" step="0.01" value={revenueAmount}
                  onChange={(e) => setRevenueAmount(e.target.value)} required />
                <button className="btn-primary" type="submit">Uplati</button>
              </div>
            </form>
          )}

          <form className="mint-form" onSubmit={handleList}>
            <h4 className="section-title">Izlistaj udjele na Marketplace</h4>
            <div className="mint-form__row">
              <input placeholder="Broj udjela" type="number" value={listForm.amount}
                onChange={(e) => setListForm({ ...listForm, amount: e.target.value })} required />
              <input placeholder="Cijena po udjelu (ETH)" type="number" step="0.001" value={listForm.price}
                onChange={(e) => setListForm({ ...listForm, price: e.target.value })} required />
              <button className="btn-primary" type="submit">Izlistaj</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}