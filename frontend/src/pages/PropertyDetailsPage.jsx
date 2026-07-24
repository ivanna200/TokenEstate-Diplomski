import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { fetchProperty } from "../services/propertyNFTService";
import { tokenizeProperty, getPropertyTokenAddress } from "../services/tokenFactoryService";
import { fetchTokenSummary, depositRevenue, withdrawEarnings, approveMarketplace } from "../services/propertyTokenService";
import { createListing } from "../services/marketplaceService";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import { formatEth } from "../utils/format";
import { opisiGresku } from "../utils/errors";
import { TransactionHistory } from "../components/TransactionHistory";

export function PropertyDetailsPage({ tokenId, onBack }) {
  const { provider, signer, account } = useWallet();
  const { showToast } = useToast();
  const [property, setProperty] = useState(null);
  const [tokenAddress, setTokenAddress] = useState(null);
  const [tokenSummary, setTokenSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [osvjeziIstoriju, setOsvjeziIstoriju] = useState(0);
  const isSubmittingRef = useRef(false);

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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setPendingAction("tokenize");
    try {
      await tokenizeProperty(signer, { propertyId: tokenId, ...tokenizeForm });
      await load();
      setOsvjeziIstoriju((n) => n + 1);
      showToast("Nekretnina je uspješno tokenizovana.", "success");
    } catch (err) {
      showToast(opisiGresku(err), "error");
    } finally {
      setPendingAction(null);
      isSubmittingRef.current = false;
    }
  }

  const [revenueAmount, setRevenueAmount] = useState("");
  async function handleDeposit(e) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setPendingAction("deposit");
    try {
      await depositRevenue(signer, tokenAddress, revenueAmount);
      setRevenueAmount("");
      await load();
      setOsvjeziIstoriju((n) => n + 1);
      showToast("Prihod je uspješno uplaćen.", "success");
    } catch (err) {
      showToast(opisiGresku(err), "error");
    } finally {
      setPendingAction(null);
      isSubmittingRef.current = false;
    }
  }

  async function handleWithdraw() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setPendingAction("withdraw");
    try {
      await withdrawEarnings(signer, tokenAddress);
      await load();
      setOsvjeziIstoriju((n) => n + 1);
      showToast("Prihod je uspješno povučen.", "success");
    } catch (err) {
      showToast(opisiGresku(err), "error");
    } finally {
      setPendingAction(null);
      isSubmittingRef.current = false;
    }
  }

  const [listForm, setListForm] = useState({ amount: "", price: "" });
  async function handleList(e) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setPendingAction("list");
    try {
      // Redni brojevi transakcija racunaju se unaprijed, da bi se izbjegao
      // problem kesiranja te vrijednosti u biblioteci ethers.js pri dvije
      // uzastopne transakcije istog naloga.
      const startNonce = await signer.getNonce();
      await approveMarketplace(
        signer, tokenAddress, CONTRACT_ADDRESSES.Marketplace, listForm.amount,
        { nonce: startNonce }
      );
      await createListing(
        signer, { tokenAddress, amount: listForm.amount, pricePerTokenInEth: listForm.price },
        { nonce: startNonce + 1 }
      );
      setListForm({ amount: "", price: "" });
      showToast("Oglas je uspješno kreiran na Marketplace-u.", "success");
    } catch (err) {
      showToast(opisiGresku(err), "error");
    } finally {
      setPendingAction(null);
      isSubmittingRef.current = false;
    }
  }

  if (isLoading) return <p className="muted">Učitavanje...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!property) return null;

  return (
    <div>
      <button className="btn-link" onClick={onBack}>← Nazad na listu nekretnina</button>
      <h2 className="section-title">Nekretnina #{property.tokenId}</h2>
      <p>{property.location}</p>
      <p className="muted">Procijenjena vrijednost: {formatEth(ethers.formatEther(property.valuationInWei))} ETH</p>

      {!property.isTokenized && isAdmin && (
        <form className="mint-form" onSubmit={handleTokenize}>
          <h3 className="section-title">Tokenizuj nekretninu</h3>
          <div className="mint-form__row">
            <input placeholder="Naziv tokena" value={tokenizeForm.name}
              onChange={(e) => setTokenizeForm({ ...tokenizeForm, name: e.target.value })}
              disabled={pendingAction === "tokenize"} required />
            <input placeholder="Simbol (npr. TEBL1)" value={tokenizeForm.symbol}
              onChange={(e) => setTokenizeForm({ ...tokenizeForm, symbol: e.target.value })}
              disabled={pendingAction === "tokenize"} required />
            <input placeholder="Broj udjela" type="number" min="1" value={tokenizeForm.totalShares}
              onChange={(e) => setTokenizeForm({ ...tokenizeForm, totalShares: e.target.value })}
              disabled={pendingAction === "tokenize"} required />
            <button className="btn-primary" type="submit" disabled={pendingAction === "tokenize"}>
              {pendingAction === "tokenize" ? "Tokenizacija u toku..." : "Tokenizuj"}
            </button>
          </div>
        </form>
      )}

      {!property.isTokenized && !isAdmin && (
        <p className="muted">Ova nekretnina još nije tokenizovana od strane administratora platforme.</p>
      )}

      {property.isTokenized && tokenSummary && (
        <>
          <div className="token-panel">
            <h3 className="section-title">{tokenSummary.name} ({tokenSummary.symbol})</h3>
            <div className="token-stats">
              <div><span className="muted">Ukupno udjela</span><br />{tokenSummary.totalSupply.toString()}</div>
              <div><span className="muted">Vaši udjeli</span><br />{tokenSummary.balance.toString()}</div>
              <div><span className="muted">Neisplaćeni prihod</span><br />{formatEth(ethers.formatEther(tokenSummary.earnings))} ETH</div>
            </div>

            <button
              className="btn-primary"
              onClick={handleWithdraw}
              disabled={tokenSummary.earnings === 0n || pendingAction === "withdraw"}
            >
              {pendingAction === "withdraw" ? "Povlačenje u toku..." : "Povuci prihod"}
            </button>

            {isAdmin && (
              <form className="mint-form" onSubmit={handleDeposit}>
                <h4 className="section-title">Uplati prihod (npr. zakupninu)</h4>
                <div className="mint-form__row">
                  <input placeholder="Iznos (ETH)" type="number" step="0.01" min="0" value={revenueAmount}
                    onChange={(e) => setRevenueAmount(e.target.value)}
                    disabled={pendingAction === "deposit"} required />
                  <button className="btn-primary" type="submit" disabled={pendingAction === "deposit"}>
                    {pendingAction === "deposit" ? "Uplata u toku..." : "Uplati"}
                  </button>
                </div>
              </form>
            )}

            {tokenSummary.balance > 0n && (
              <form className="mint-form" onSubmit={handleList}>
                <h4 className="section-title">Izlistaj udjele na Marketplace</h4>
                <div className="mint-form__row">
                  <input placeholder="Broj udjela" type="number" min="1" max={tokenSummary.balance.toString()} value={listForm.amount}
                    onChange={(e) => setListForm({ ...listForm, amount: e.target.value })}
                    disabled={pendingAction === "list"} required />
                  <input placeholder="Cijena po udjelu (ETH)" type="number" step="0.001" min="0" value={listForm.price}
                    onChange={(e) => setListForm({ ...listForm, price: e.target.value })}
                    disabled={pendingAction === "list"} required />
                  <button className="btn-primary" type="submit" disabled={pendingAction === "list"}>
                    {pendingAction === "list" ? "Izlistavanje u toku..." : "Izlistaj"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="token-panel">
            <TransactionHistory key={osvjeziIstoriju} tokenAddress={tokenAddress} />
          </div>
        </>
      )}
    </div>
  );
}