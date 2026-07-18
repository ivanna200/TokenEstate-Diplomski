import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("PropertyNFT", function () {
  async function deployFixture() {
    const [owner, investor1] = await ethers.getSigners();

    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    const propertyNFT = await PropertyNFT.deploy(owner.address);

    return { propertyNFT, owner, investor1 };
  }

  it("treba da kreira novu nekretninu (mint) i zapamti njene podatke", async function () {
    const { propertyNFT, owner } = await deployFixture();

    const tx = await propertyNFT.mintProperty(
      owner.address,
      "Banja Luka, Kralja Petra I 10",
      ethers.parseEther("150"),
      "ipfs://primjer-metapodaci"
    );
    await tx.wait();

    const property = await propertyNFT.properties(0);
    expect(property.location).to.equal("Banja Luka, Kralja Petra I 10");
    expect(property.valuationInWei).to.equal(ethers.parseEther("150"));
    expect(property.isTokenized).to.equal(false);
  });

  it("treba da odbije mintProperty ako poziva neko ko nije vlasnik ugovora", async function () {
    const { propertyNFT, investor1 } = await deployFixture();

    await expect(
      propertyNFT
        .connect(investor1)
        .mintProperty(investor1.address, "Sarajevo", 1000n, "ipfs://x")
    ).to.be.revertedWithCustomError(propertyNFT, "OwnableUnauthorizedAccount");
  });

  it("treba da ispravno vrati tokenURI za postojecu nekretninu", async function () {
    const { propertyNFT, owner } = await deployFixture();

    await propertyNFT.mintProperty(
      owner.address,
      "Doboj, Ulica X",
      ethers.parseEther("80"),
      "ipfs://doboj-metadata"
    );

    expect(await propertyNFT.tokenURI(0)).to.equal("ipfs://doboj-metadata");
  });
});