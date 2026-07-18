import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenEstateModule", (m) => {
  const deployer = m.getAccount(0);

  const propertyNFT = m.contract("PropertyNFT", [deployer]);
  const tokenFactory = m.contract("TokenFactory", [propertyNFT, deployer]);
  const marketplace = m.contract("Marketplace", []);

  m.call(propertyNFT, "transferOwnership", [tokenFactory]);

  return { propertyNFT, tokenFactory, marketplace };
});