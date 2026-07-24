// Prevodjenje tehnickih poruka iz pametnih ugovora i biblioteke ethers.js
// u poruke razumljive korisniku.

const MAPA_PORUKA = [
  ["nekretnina je vec tokenizovana", "Ova nekretnina je već tokenizovana."],
  ["nekretnina ne postoji", "Tražena nekretnina ne postoji."],
  ["iznos mora biti > 0", "Iznos mora biti veći od nule."],
  ["nema izdatih tokena", "Za ovu nekretninu još nisu izdati udjeli."],
  ["nema sredstava za povlacenje", "Trenutno nemate prihod koji možete povući."],
  ["transfer neuspjesan", "Prenos sredstava nije uspio."],
  ["kolicina mora biti > 0", "Broj udjela mora biti veći od nule."],
  ["cijena mora biti > 0", "Cijena mora biti veća od nule."],
  ["nedovoljan broj tokena", "Nemate dovoljan broj udjela za ovu radnju."],
  ["potrebno je prethodno pozvati approve", "Nije data dozvola za raspolaganje udjelima."],
  ["oglas nije aktivan", "Ovaj oglas više nije aktivan."],
  ["nevalidna kolicina", "Unesena količina nije ispravna."],
  ["neispravan iznos", "Poslati iznos ne odgovara ukupnoj cijeni oglasa."],
  ["samo prodavac moze otkazati", "Oglas može otkazati samo prodavac."],
  ["transfer tokena neuspjesan", "Prenos udjela nije uspio."],
  ["OwnableUnauthorizedAccount", "Nemate ovlašćenje za ovu radnju. Ova radnja je dostupna samo administratoru platforme."],
];

export function opisiGresku(err) {
  const sirovo = [
    err?.reason,
    err?.shortMessage,
    err?.info?.error?.message,
    err?.message,
  ]
    .filter(Boolean)
    .join(" | ");

  const malimSlovima = sirovo.toLowerCase();

  for (const [kljuc, poruka] of MAPA_PORUKA) {
    if (malimSlovima.includes(kljuc.toLowerCase())) {
      return poruka;
    }
  }

  if (malimSlovima.includes("nonce")) {
    return "Prethodna transakcija još nije obrađena. Sačekajte trenutak i pokušajte ponovo.";
  }
  if (malimSlovima.includes("insufficient funds")) {
    return "Nalog nema dovoljno sredstava za ovu transakciju.";
  }
  if (
    malimSlovima.includes("could not detect network") ||
    malimSlovima.includes("econnrefused") ||
    malimSlovima.includes("failed to fetch")
  ) {
    return "Nema veze sa lokalnom mrežom. Provjerite da li je pokrenuta komandom: npx hardhat node";
  }
  if (malimSlovima.includes("user rejected")) {
    return "Transakcija je otkazana.";
  }

  return "Radnja nije uspjela. " + (err?.shortMessage ?? err?.message ?? "Nepoznata greška.");
}