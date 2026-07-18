import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenEstateModule", (m) => {
  // Nalog koji deployuje ugovore postaje i njihov inicijalni vlasnik (owner)
  const deployer = m.getAccount(0);

  // 1. Deployuj PropertyNFT ugovor
  const propertyNFT = m.contract("PropertyNFT", [deployer]);

  // 2. Deployuj TokenFactory, povezan sa adresom PropertyNFT ugovora
  const tokenFactory = m.contract("TokenFactory", [propertyNFT, deployer]);

  // 3. Prenesi vlasništvo nad PropertyNFT na TokenFactory,
  //    da bi TokenFactory mogao pozivati markAsTokenized()
  m.call(propertyNFT, "transferOwnership", [tokenFactory]);

  return { propertyNFT, tokenFactory };
});