import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("PropertyToken", function () {
  async function deployFixture() {
    const [owner, investor1, investor2] = await ethers.getSigners();

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy(
      0, // propertyId
      "TokenEstate - Stan Banja Luka",
      "TEBL01",
      1000n, // totalShares
      owner.address
    );

    return { propertyToken, owner, investor1, investor2 };
  }

  it("treba da dodijeli sve udjele inicijalnom vlasniku pri kreiranju", async function () {
    const { propertyToken, owner } = await deployFixture();
    expect(await propertyToken.balanceOf(owner.address)).to.equal(1000n);
    expect(await propertyToken.totalSupply()).to.equal(1000n);
  });

  it("treba proporcionalno da raspodijeli prihod izmedju dva vlasnika (60/40)", async function () {
    const { propertyToken, owner, investor1, investor2 } = await deployFixture();

    // Vlasnik prenosi 600 tokena investitoru1 i 400 investitoru2
    await propertyToken.transfer(investor1.address, 600n);
    await propertyToken.transfer(investor2.address, 400n);

    // Unosi se prihod od 10 ETH (npr. zakupnina)
    await propertyToken.depositRevenue({ value: ethers.parseEther("10") });

    const earnings1 = await propertyToken.earningsOf(investor1.address);
    const earnings2 = await propertyToken.earningsOf(investor2.address);

    // 60% od 10 ETH = 6 ETH, 40% od 10 ETH = 4 ETH
    expect(earnings1).to.equal(ethers.parseEther("6"));
    expect(earnings2).to.equal(ethers.parseEther("4"));
  });

  it("treba da omoguci investitoru da povuce svoj prihod, i saldo mu se svede na nulu nakon toga", async function () {
    const { propertyToken, owner, investor1 } = await deployFixture();

    await propertyToken.transfer(investor1.address, 1000n); // investitor1 = 100% vlasnik

    await propertyToken.depositRevenue({ value: ethers.parseEther("5") });

    const balanceBefore = await ethers.provider.getBalance(investor1.address);

    const tx = await propertyToken.connect(investor1).withdrawEarnings();
    const receipt = await tx.wait();
    const gasCost = receipt!.gasUsed * receipt!.gasPrice;

    const balanceAfter = await ethers.provider.getBalance(investor1.address);

    expect(balanceAfter).to.equal(
      balanceBefore + ethers.parseEther("5") - gasCost
    );

    // Nakon povlacenja, ne treba da ima jos sredstava za povlacenje
    expect(await propertyToken.earningsOf(investor1.address)).to.equal(0n);
  });

  it("treba da sacuva pravo na ranije zaraceni prihod nakon prodaje tokena", async function () {
    const { propertyToken, owner, investor1, investor2 } = await deployFixture();

    await propertyToken.transfer(investor1.address, 1000n);
    await propertyToken.depositRevenue({ value: ethers.parseEther("3") });

    // investitor1 prodaje/prenosi SVE tokene investitoru2 NAKON sto je prihod vec ulozen
    await propertyToken.connect(investor1).transfer(investor2.address, 1000n);

    // investitor1 treba i dalje da moze povuci prihod zaracen PRIJE prodaje
    expect(await propertyToken.earningsOf(investor1.address)).to.equal(
      ethers.parseEther("3")
    );
    // investitor2 (novi vlasnik) ne treba da ima potraznja za prihod uplacen prije nego je postao vlasnik
    expect(await propertyToken.earningsOf(investor2.address)).to.equal(0n);
  });
});