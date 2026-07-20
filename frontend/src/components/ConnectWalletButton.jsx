import { useWallet } from "../hooks/useWallet";
import { shortenAddress, formatEth } from "../utils/format";

export function ConnectWalletButton() {
  const { account, accounts, selectedAccountIndex, setSelectedAccountIndex, balance, isConnecting, error } = useWallet();

  if (error) {
    return <div className="wallet-badge wallet-badge--error">{error}</div>;
  }

  if (isConnecting) {
    return <div className="wallet-badge">Povezivanje na lokalnu mrežu...</div>;
  }

  return (
    <div className="wallet-badge">
      <select
        className="wallet-select"
        value={selectedAccountIndex}
        onChange={(e) => setSelectedAccountIndex(Number(e.target.value))}
        aria-label="Izaberi nalog"
      >
        {accounts.map((acc, idx) => (
          <option key={acc.address} value={idx}>
            {acc.label}
          </option>
        ))}
      </select>
      <div className="wallet-info">
        <span className="wallet-address">{shortenAddress(account.address)}</span>
        <span className="wallet-balance">{balance ? `${formatEth(balance, 2)} ETH` : "—"}</span>
      </div>
    </div>
  );
}