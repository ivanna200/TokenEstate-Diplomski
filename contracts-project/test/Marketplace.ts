import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

describe("Marketplace", function () {
  async function deployFixture() {
    const [owner, seller, buyer] = await ethers.getSigners();

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy(
      0,
      "TokenEstate - Test",
      "TET",
      1000n,
      seller.address // seller je odmah inicijalni vlasnik svih udjela
    );

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();

    return { propertyToken, marketplace, owner, seller, buyer };
  }

  it("treba da napravi oglas (listing) kada prodavac ima tokene i odobri (approve) marketplace", async function () {
    const { propertyToken, marketplace, seller } = await deployFixture();

    await propertyToken
      .connect(seller)
      .approve(await marketplace.getAddress(), 200n);

    const tx = await marketplace
      .connect(seller)
      .createListing(await propertyToken.getAddress(), 200n, ethers.parseEther("0.01"));
    await tx.wait();

    const listing = await marketplace.listings(0);
    expect(listing.seller).to.equal(seller.address);
    expect(listing.amount).to.equal(200n);
    expect(listing.active).to.equal(true);
  });

  it("treba da odbije createListing ako prodavac nije prethodno pozvao approve()", async function () {
    const { propertyToken, marketplace, seller } = await deployFixture();

    await expect(
      marketplace
        .connect(seller)
        .createListing(await propertyToken.getAddress(), 200n, ethers.parseEther("0.01"))
    ).to.be.revertedWith("Marketplace: potrebno je prethodno pozvati approve()");
  });

  it("treba da izvrsi kupovinu - prenese tokene kupcu i ETH prodavcu", async function () {
    const { propertyToken, marketplace, seller, buyer } = await deployFixture();

    await propertyToken
      .connect(seller)
      .approve(await marketplace.getAddress(), 200n);

    await marketplace
      .connect(seller)
      .createListing(await propertyToken.getAddress(), 200n, ethers.parseEther("0.01"));

    const totalPrice = 200n * ethers.parseEther("0.01");

    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

    await marketplace.connect(buyer).purchase(0, 200n, { value: totalPrice });

    expect(await propertyToken.balanceOf(buyer.address)).to.equal(200n);
    expect(await propertyToken.balanceOf(seller.address)).to.equal(800n);

    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
    expect(sellerBalanceAfter).to.equal(sellerBalanceBefore + totalPrice);
  });

  it("treba da odbije kupovinu ako je poslat neispravan iznos ETH", async function () {
    const { propertyToken, marketplace, seller, buyer } = await deployFixture();

    await propertyToken.connect(seller).approve(await marketplace.getAddress(), 200n);
    await marketplace
      .connect(seller)
      .createListing(await propertyToken.getAddress(), 200n, ethers.parseEther("0.01"));

    await expect(
      marketplace.connect(buyer).purchase(0, 200n, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Marketplace: neispravan iznos ETH");
  });

  it("treba da dozvoli prodavcu da otkaze svoj oglas", async function () {
    const { propertyToken, marketplace, seller } = await deployFixture();

    await propertyToken.connect(seller).approve(await marketplace.getAddress(), 200n);
    await marketplace
      .connect(seller)
      .createListing(await propertyToken.getAddress(), 200n, ethers.parseEther("0.01"));

    await marketplace.connect(seller).cancelListing(0);

    const listing = await marketplace.listings(0);
    expect(listing.active).to.equal(false);
  });

  it("treba da odbije otkazivanje oglasa od strane nekog ko nije prodavac", async function () {
    const { propertyToken, marketplace, seller, buyer } = await deployFixture();

    await propertyToken.connect(seller).approve(await marketplace.getAddress(), 200n);
    await marketplace
      .connect(seller)
      .createListing(await propertyToken.getAddress(), 200n, ethers.parseEther("0.01"));

    await expect(
      marketplace.connect(buyer).cancelListing(0)
    ).to.be.revertedWith("Marketplace: samo prodavac moze otkazati");
  });
});