// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Marketplace
/// @notice Omogucava vlasnicima udjela (PropertyToken) da ih izliste na
/// prodaju po fiksnoj cijeni, i drugim investitorima da ih kupe direktno
/// pametnim ugovorom, uz atomicnu i sigurnu razmjenu ETH <-> tokeni.
contract Marketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address tokenAddress; // adresa PropertyToken ugovora
        uint256 amount;       // broj tokena na prodaju
        uint256 pricePerToken; // cijena po jednom tokenu, u wei
        bool active;
    }

    uint256 private _nextListingId;
    mapping(uint256 => Listing) public listings;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed tokenAddress,
        uint256 amount,
        uint256 pricePerToken
    );
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPaid
    );
    event ListingCancelled(uint256 indexed listingId);

    /// @notice Prodavac izlistava odredjenu kolicinu tokena na prodaju.
    /// @dev Prodavac mora prethodno pozvati approve() na PropertyToken ugovoru,
    /// dajuci ovom Marketplace ugovoru dozvolu da prenese tokene u njegovo ime.
    function createListing(
        address tokenAddress,
        uint256 amount,
        uint256 pricePerToken
    ) external returns (uint256 listingId) {
        require(amount > 0, "Marketplace: kolicina mora biti > 0");
        require(pricePerToken > 0, "Marketplace: cijena mora biti > 0");

        IERC20 token = IERC20(tokenAddress);
        require(
            token.balanceOf(msg.sender) >= amount,
            "Marketplace: nedovoljan broj tokena"
        );
        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "Marketplace: potrebno je prethodno pozvati approve()"
        );

        listingId = _nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenAddress: tokenAddress,
            amount: amount,
            pricePerToken: pricePerToken,
            active: true
        });

        emit Listed(listingId, msg.sender, tokenAddress, amount, pricePerToken);
    }

    /// @notice Kupac kupuje dio ili cijelu kolicinu tokena iz oglasa, slanjem ETH.
    function purchase(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Marketplace: oglas nije aktivan");
        require(amount > 0 && amount <= listing.amount, "Marketplace: nevalidna kolicina");

        uint256 totalPrice = amount * listing.pricePerToken;
        require(msg.value == totalPrice, "Marketplace: neispravan iznos ETH");

        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        IERC20 token = IERC20(listing.tokenAddress);

        // Prenos tokena od prodavca ka kupcu
        bool tokenSent = token.transferFrom(listing.seller, msg.sender, amount);
        require(tokenSent, "Marketplace: transfer tokena neuspjesan");

        // Prenos ETH od kupca ka prodavcu
        (bool ethSent, ) = payable(listing.seller).call{value: totalPrice}("");
        require(ethSent, "Marketplace: transfer ETH neuspjesan");

        emit Purchased(listingId, msg.sender, amount, totalPrice);
    }

    /// @notice Prodavac moze otkazati svoj aktivni oglas.
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Marketplace: samo prodavac moze otkazati");
        require(listing.active, "Marketplace: oglas nije aktivan");

        listing.active = false;
        emit ListingCancelled(listingId);
    }
}