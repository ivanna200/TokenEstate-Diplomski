import { useWallet } from "../hooks/useWallet";

function shortenAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { account, accounts, selectedAccountIndex, setSelectedAccountIndex, balance, isConnecting, error } = useWallet();

  if (error) {
    return <div className="wallet-badge wallet-badge--error">{error}</div>;
  }

  if (isConnecting) {
    return <div className="wallet-badge">Povezivanje...</div>;
  }

  return (
    <div className="wallet-badge">
      <select
        className="wallet-select"
        value={selectedAccountIndex}
        onChange={(e) => setSelectedAccountIndex(Number(e.target.value))}
      >
        {accounts.map((acc, idx) => (
          <option key={acc.address} value={idx}>
            {acc.label}
          </option>
        ))}
      </select>
      <div className="wallet-info">
        <span className="wallet-address">{shortenAddress(account.address)}</span>
        <span className="wallet-balance">{balance ? `${Number(balance).toFixed(2)} ETH` : "—"}</span>
      </div>
    </div>
  );
}