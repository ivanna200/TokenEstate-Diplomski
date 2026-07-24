import { ethers } from "ethers";
import PropertyTokenArtifact from "../contracts/abis/PropertyToken.json";

// Kes vremena blokova, da se isti blok ne dohvata vise puta.
const kesBlokova = new Map();

async function vrijemeBloka(provider, brojBloka) {
  if (kesBlokova.has(brojBloka)) return kesBlokova.get(brojBloka);
  const blok = await provider.getBlock(brojBloka);
  const vrijeme = blok ? blok.timestamp : null;
  kesBlokova.set(brojBloka, vrijeme);
  return vrijeme;
}

/**
 * Rekonstruise istoriju dogadjaja za jednu tokenizovanu nekretninu,
 * citajuci dogadjaje koje je ugovor PropertyToken emitovao.
 * Ovo pokazuje kljucnu osobinu blokcejna - svaka promjena ostavlja trajan zapis.
 */
export async function fetchPropertyHistory(provider, tokenAddress) {
  const contract = new ethers.Contract(
    tokenAddress,
    PropertyTokenArtifact.abi,
    provider
  );

  const [prenosi, uplate, isplate] = await Promise.all([
    contract.queryFilter(contract.filters.Transfer()),
    contract.queryFilter(contract.filters.RevenueDeposited()),
    contract.queryFilter(contract.filters.EarningsWithdrawn()),
  ]);

  const stavke = [];

  for (const e of prenosi) {
    const od = e.args.from;
    const ka = e.args.to;
    const kolicina = e.args.value;
    const jeIzdavanje = od === ethers.ZeroAddress;

    stavke.push({
      blok: e.blockNumber,
      hash: e.transactionHash,
      tip: jeIzdavanje ? "izdavanje" : "prenos",
      naslov: jeIzdavanje ? "Izdavanje udjela" : "Prenos udjela",
      opis: jeIzdavanje
        ? `Izdato ${kolicina.toString()} udjela`
        : `Preneseno ${kolicina.toString()} udjela`,
      od: jeIzdavanje ? null : od,
      ka,
    });
  }

  for (const e of uplate) {
    stavke.push({
      blok: e.blockNumber,
      hash: e.transactionHash,
      tip: "uplata",
      naslov: "Uplata prihoda",
      opis: `Uplaćeno ${ethers.formatEther(e.args.amount)} ETH`,
      od: null,
      ka: null,
    });
  }

  for (const e of isplate) {
    stavke.push({
      blok: e.blockNumber,
      hash: e.transactionHash,
      tip: "isplata",
      naslov: "Preuzimanje prihoda",
      opis: `Preuzeto ${ethers.formatEther(e.args.amount)} ETH`,
      od: null,
      ka: e.args.investor,
    });
  }

  // Dodavanje vremena iz blokova
  await Promise.all(
    stavke.map(async (s) => {
      s.vrijeme = await vrijemeBloka(provider, s.blok);
    })
  );

  // Najnovije prvo
  stavke.sort((a, b) => b.blok - a.blok);

  return stavke;
}