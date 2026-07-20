import { useState } from "react";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import { ConnectWalletButton } from "./components/ConnectWalletButton";
import { ToastContainer } from "./components/ToastContainer";
import { HomePage } from "./pages/HomePage";
import { PropertyDetailsPage } from "./pages/PropertyDetailsPage";
import { MarketplacePage } from "./pages/MarketplacePage";

function App() {
  const [view, setView] = useState({ page: "home" });

  return (
    <ToastProvider>
      <WalletProvider>
        <div className="app-shell">
          <header className="app-header">
            <h1 className="app-title">Token<span>Estate</span></h1>
            <nav className="app-nav">
              <button className={view.page === "home" ? "nav-link active" : "nav-link"} onClick={() => setView({ page: "home" })}>Nekretnine</button>
              <button className={view.page === "marketplace" ? "nav-link active" : "nav-link"} onClick={() => setView({ page: "marketplace" })}>Marketplace</button>
            </nav>
            <ConnectWalletButton />
          </header>

          {view.page === "home" && <HomePage onSelectProperty={(tokenId) => setView({ page: "details", tokenId })} />}
          {view.page === "details" && <PropertyDetailsPage tokenId={view.tokenId} onBack={() => setView({ page: "home" })} />}
          {view.page === "marketplace" && <MarketplacePage />}
        </div>
        <ToastContainer />
      </WalletProvider>
    </ToastProvider>
  );
}

export default App;