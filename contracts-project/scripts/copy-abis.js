import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const koren = join(__dirname, "..");
const artifactsDir = join(koren, "artifacts", "contracts");
const odredisniFolder = join(koren, "..", "frontend", "src", "contracts", "abis");

const UGOVORI = ["PropertyNFT", "PropertyToken", "TokenFactory", "Marketplace"];

if (!existsSync(odredisniFolder)) {
  mkdirSync(odredisniFolder, { recursive: true });
}

let greske = 0;

for (const naziv of UGOVORI) {
  const izvor = join(artifactsDir, `${naziv}.sol`, `${naziv}.json`);

  if (!existsSync(izvor)) {
    console.error(`GRESKA: nije pronadjen artifact za ${naziv}.`);
    console.error(`        Ocekivana putanja: ${izvor}`);
    console.error(`        Pokrenite prvo: npx hardhat compile`);
    greske++;
    continue;
  }

  const artifact = JSON.parse(readFileSync(izvor, "utf8"));

  // U frontend prenosimo samo ono sto je potrebno - naziv i opis interfejsa (ABI).
  // Bytecode i ostali podaci iz artifact fajla nisu potrebni korisnickoj aplikaciji.
  const sadrzaj = {
    contractName: naziv,
    abi: artifact.abi,
  };

  writeFileSync(
    join(odredisniFolder, `${naziv}.json`),
    JSON.stringify(sadrzaj, null, 2),
    "utf8"
  );

  console.log(`Kopiran ABI: ${naziv}`);
}

if (greske > 0) {
  console.error(`\nZavrseno sa ${greske} greske/greski.`);
  process.exitCode = 1;
} else {
  console.log(`\nSvi ABI fajlovi su azurirani u: frontend/src/contracts/abis/`);
}