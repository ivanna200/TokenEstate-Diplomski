import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("TokenFactory", function () {
  async function deployAndMintFixture() {
    const [owner, investor1] = await ethers.getSigners();

    const PropertyNFT = await ethers.getContractFactory("PropertyNFT");
    const propertyNFT = await PropertyNFT.deploy(owner.address);

    await propertyNFT.mintProperty(
      owner.address,
      "Banja Luka, Centar",
      ethers.parseEther("200"),
      "ipfs://metadata"
    );

    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(
      await propertyNFT.getAddress(),
      owner.address
    );

    await propertyNFT.transferOwnership(await tokenFactory.getAddress());

    return { propertyNFT, tokenFactory, owner, investor1 };
  }

  it("treba da kreira novi PropertyToken za postojecu nekretninu", async function () {
    const { tokenFactory, owner } = await deployAndMintFixture();

    await tokenFactory.tokenizeProperty(0, "TokenEstate - BL Centar", "TEBLC", 1000n);

    const tokenAddress = await tokenFactory.propertyTokenOf(0);
    expect(tokenAddress).to.not.equal(ethers.ZeroAddress);

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = PropertyToken.attach(tokenAddress);

    expect(await (propertyToken as any).balanceOf(owner.address)).to.equal(1000n);
  });

  it("treba da azurira isTokenized status u PropertyNFT ugovoru", async function () {
    const { propertyNFT, tokenFactory } = await deployAndMintFixture();

    await tokenFactory.tokenizeProperty(0, "Test", "TST", 500n);

    const property = await propertyNFT.properties(0);
    expect(property.isTokenized).to.equal(true);
  });

  it("treba da odbije ponovnu tokenizaciju iste nekretnine", async function () {
    const { tokenFactory } = await deployAndMintFixture();

    await tokenFactory.tokenizeProperty(0, "Test", "TST", 500n);

    await expect(
      tokenFactory.tokenizeProperty(0, "Test2", "TST2", 300n)
    ).to.be.revertedWith("TokenFactory: nekretnina je vec tokenizovana");
  });

  it("treba da odbije tokenizaciju nepostojece nekretnine", async function () {
    const { tokenFactory } = await deployAndMintFixture();

    await expect(
      tokenFactory.tokenizeProperty(99, "Test", "TST", 500n)
    ).to.be.revert(ethers);
  });
});