import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { fetchPropertyHistory } from "../services/historyService";
import { shortenAddress } from "../utils/format";

function formatirajVrijeme(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionHistory({ tokenAddress }) {
  const { provider } = useWallet();
  const [stavke, setStavke] = useState([]);
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState(null);
  const [prosireno, setProsireno] = useState(false);

  useEffect(() => {
    let ponisteno = false;

    async function ucitaj() {
      try {
        setUcitava(true);
        setGreska(null);
        const podaci = await fetchPropertyHistory(provider, tokenAddress);
        if (!ponisteno) setStavke(podaci);
      } catch {
        if (!ponisteno) setGreska("Ne mogu učitati istoriju transakcija.");
      } finally {
        if (!ponisteno) setUcitava(false);
      }
    }

    if (tokenAddress) ucitaj();
    return () => {
      ponisteno = true;
    };
  }, [provider, tokenAddress]);

  if (ucitava) return <p className="muted">Učitavanje istorije...</p>;
  if (greska) return <p className="error-text">{greska}</p>;
  if (stavke.length === 0) return <p className="muted">Još nema zabilježenih transakcija.</p>;

  const prikazane = prosireno ? stavke : stavke.slice(0, 5);

  return (
    <div className="history">
      <h4 className="section-title">Istorija transakcija na blokčejnu</h4>
      <ul className="history__list">
        {prikazane.map((s) => (
          <li key={s.hash + s.tip + s.opis} className={`history__item history__item--${s.tip}`}>
            <div className="history__row">
              <span className="history__title">{s.naslov}</span>
              <span className="history__time">{formatirajVrijeme(s.vrijeme)}</span>
            </div>
            <div className="history__desc">{s.opis}</div>
            <div className="history__meta">
              {s.od && <>od {shortenAddress(s.od)} </>}
              {s.ka && <>ka {shortenAddress(s.ka)} </>}
              <span className="history__block">blok #{s.blok}</span>
            </div>
            <div className="history__hash" title={s.hash}>
              {s.hash.slice(0, 18)}...
            </div>
          </li>
        ))}
      </ul>

      {stavke.length > 5 && (
        <button className="btn-link" onClick={() => setProsireno(!prosireno)}>
          {prosireno ? "Prikaži manje" : `Prikaži sve (${stavke.length})`}
        </button>
      )}
    </div>
  );
}