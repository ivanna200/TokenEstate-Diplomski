// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PropertyNFT
/// @notice Predstavlja jedinstveno vlasništvo nad nekretninom kao NFT (ERC-721).
/// Svaka nekretnina u sistemu TokenEstate ima tačno jedan NFT koji čuva njene
/// osnovne podatke. Kasnije se ta nekretnina "frakcionalizuje" kroz zaseban
/// ERC-20 ugovor (TokenFactory), koji predstavlja udjele u ovoj imovini.
contract PropertyNFT is ERC721, Ownable {
    struct Property {
        string location;        // adresa / lokacija nekretnine
        uint256 valuationInWei; // procijenjena vrijednost nekretnine (u wei)
        string metadataURI;     // link ka dodatnim podacima (slike, dokumentacija)
        bool isTokenized;       // da li je već kreiran ERC-20 token za ovu nekretninu
    }

    uint256 private _nextTokenId;

    mapping(uint256 => Property) public properties;

    event PropertyMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string location,
        uint256 valuationInWei
    );

    event PropertyTokenizedStatusChanged(uint256 indexed tokenId, bool isTokenized);

    constructor(address initialOwner)
        ERC721("TokenEstate Property", "TEPROP")
        Ownable(initialOwner)
    {}

    /// @notice Kreira novi NFT koji predstavlja nekretninu.
    /// @dev Samo vlasnik ugovora (administrator platforme) može kreirati nove nekretnine.
    /// U stvarnom sistemu, ovo bi bilo ograničeno procesom verifikacije vlasništva.
    function mintProperty(
        address to,
        string calldata location,
        uint256 valuationInWei,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;

        properties[tokenId] = Property({
            location: location,
            valuationInWei: valuationInWei,
            metadataURI: metadataURI,
            isTokenized: false
        });

        _safeMint(to, tokenId);

        emit PropertyMinted(tokenId, to, location, valuationInWei);
    }

    /// @notice Označava nekretninu kao frakcionalizovanu (poziva TokenFactory ugovor).
    function markAsTokenized(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "PropertyNFT: nekretnina ne postoji");
        properties[tokenId].isTokenized = true;
        emit PropertyTokenizedStatusChanged(tokenId, true);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return properties[tokenId].metadataURI;
    }
}