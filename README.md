# TokenEstate

Platforma za tokenizaciju nekretnina i frakcijsko vlasništvo zasnovana na Web3 tehnologiji.

Diplomski rad — implementacija Web3 platforme koja omogućava tokenizaciju nekretnina (ERC-721), djelimično vlasništvo putem ERC-20 udjela, kupoprodaju udjela i automatsku, proporcionalnu distribuciju prihoda putem pametnih ugovora.

## Sadržaj

- [Opis projekta](#opis-projekta)
- [Arhitektura](#arhitektura)
- [Struktura repozitorijuma](#struktura-repozitorijuma)
- [Tehnologije](#tehnologije)
- [Pokretanje projekta (korak po korak)](#pokretanje-projekta-korak-po-korak)
- [Testiranje pametnih ugovora](#testiranje-pametnih-ugovora)
- [Gas i sigurnosna analiza](#gas-i-sigurnosna-analiza)
- [Demo nalozi](#demo-nalozi)
- [Poznata ograničenja](#poznata-ograničenja)

## Opis projekta

Sistem omogućava:
- **Registraciju nekretnine** kao NFT-a (ERC-721) — jedinstveni identitet imovine na blockchainu
- **Tokenizaciju** nekretnine u ERC-20 udjele — frakciono vlasništvo (npr. 1000 tokena = 100% vlasništva)
- **Kupoprodaju udjela** preko ugrađenog Marketplace ugovora
- **Automatsku, proporcionalnu distribuciju prihoda** (npr. zakupnine) svim vlasnicima udjela, srazmjerno njihovom broju tokena u trenutku uplate

Aplikacija je potpuno samostalna i radi lokalno, bez potrebe za internetom, MetaMask-om ili eksternim testnet servisima — pogodna za demonstraciju u okviru odbrane diplomskog rada.

## Arhitektura

Sistem se sastoji od tri sloja:

1. **Pametni ugovori** (Solidity, `contracts-project/contracts/`)
   - `PropertyNFT.sol` — ERC-721, identitet nekretnine
   - `PropertyToken.sol` — ERC-20, udjeli + distribucija prihoda
   - `TokenFactory.sol` — kreira PropertyToken za registrovanu nekretninu
   - `Marketplace.sol` — kupoprodaja udjela
2. **Lokalna blockchain mreža** — Hardhat Network (simulirani Ethereum čvor)
3. **Frontend** (React + ethers.js, `frontend/`) — korisnički interfejs koji direktno komunicira sa pametnim ugovorima

## Struktura repozitorijuma

```
TokenEstate/
├── contracts-project/       Pametni ugovori, testovi, deployment (Hardhat 3)
│   ├── contracts/              Solidity izvorni kod
│   ├── test/                   Mocha/Chai testovi (17 testova)
│   ├── ignition/modules/       Deployment skripta (Hardhat Ignition)
│   └── hardhat.config.ts
├── frontend/                 React (Vite) aplikacija
│   └── src/
│       ├── contracts/           ABI fajlovi i adrese ugovora
│       ├── config/               Konfiguracija mreže i demo naloga
│       ├── services/             Komunikacija sa blockchainom (ethers.js)
│       ├── context/              React Context (wallet, notifikacije)
│       ├── hooks/                 Prilagođeni React hooks
│       ├── components/            UI komponente za ponovnu upotrebu
│       └── pages/                 Ekrani aplikacije
├── dokumentacija/            Prilozi za diplomski rad (gas i sigurnosna analiza)
└── README.md
```

## Tehnologije

| Sloj | Tehnologija |
|---|---|
| Pametni ugovori | Solidity 0.8.28, OpenZeppelin Contracts |
| Razvojno okruženje | Hardhat 3 (Ignition za deployment, ugrađen gas reporter) |
| Testiranje ugovora | Mocha, Chai, ethers.js |
| Sigurnosna analiza | Slither (statička analiza) |
| Frontend | React 19 (Vite), ethers.js 6 |
| Jezik | JavaScript (ESM) |

## Pokretanje projekta (korak po korak)

Potrebno: Node.js (v20+), npm.

### 1. Instalacija zavisnosti

```bash
cd contracts-project
npm install

cd ../frontend
npm install
```

### 2. Pokretanje lokalne blockchain mreže

U prvom terminalu:

```bash
cd contracts-project
npx hardhat node
```

Ostaviti ovaj terminal otvorenim tokom cijelog rada sa aplikacijom.

### 3. Deployment pametnih ugovora

U drugom terminalu:

```bash
cd contracts-project
npx hardhat ignition deploy ignition/modules/TokenEstateModule.ts --network localhost
```

Nakon deploymenta, ispisuju se adrese ugovora. **Ako se razlikuju od onih u `frontend/src/contracts/addresses.js`, potrebno je ažurirati taj fajl sa novim adresama.**

### 4. Pokretanje frontend aplikacije

U trećem terminalu:

```bash
cd frontend
npm run dev
```

Otvoriti prikazani lokalni link (obično `http://localhost:5173`) u browseru.

## Testiranje pametnih ugovora

```bash
cd contracts-project
npx hardhat test
```

Pokreće kompletan test paket (17 testova) za sva četiri ugovora.

Za analizu potrošnje gasa:

```bash
npx hardhat test --gas-stats
```

## Gas i sigurnosna analiza

Detaljni rezultati analize potrošnje gasa i statičke sigurnosne analize (Slither) dokumentovani su u prilogu, u folderu `dokumentacija/`:

- `TokenEstate_Gas_Analiza.docx`
- `TokenEstate_Sigurnosna_Analiza.docx`

## Demo nalozi

Aplikacija koristi tri unaprijed definisana lokalna naloga (bez potrebe za MetaMask-om), dostupna kroz padajući meni u zaglavlju:

| Nalog | Uloga |
|---|---|
| Administrator platforme | Registruje nekretnine, tokenizuje ih, uplaćuje prihod |
| Investitor 1 | Kupuje udjele na Marketplace-u |
| Investitor 2 | Kupuje udjele na Marketplace-u |

Privatni ključevi ovih naloga su **javno poznati Hardhat test ključevi** — koriste se isključivo za lokalnu simulaciju i nikada ne smiju biti upotrijebljeni na pravoj mreži.

## Poznata ograničenja

- Frontend koristi ugrađene test naloge umjesto MetaMask/WalletConnect integracije — svjesna odluka radi potpune samostalnosti demonstracije.
- Prihod (npr. zakupnina) unosi se ručno kroz administratorski nalog — integracija sa spoljnim izvorom podataka (npr. Chainlink oracle) navedena je kao pravac budućeg razvoja.
- ABI fajlovi u frontendu su kopija iz `contracts-project/artifacts/` — nakon svake izmjene pametnog ugovora potrebno je ručno ažurirati odgovarajući ABI fajl u `frontend/src/contracts/abis/`.
