export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value, decimals = 4) {
  return Number(value).toFixed(decimals);
}