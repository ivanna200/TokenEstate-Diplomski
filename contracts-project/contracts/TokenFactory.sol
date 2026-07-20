// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PropertyNFT.sol";
import "./PropertyToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenFactory
/// @notice Centralna tačka za frakcionalizaciju nekretnina. Za svaku
/// nekretninu registrovanu u PropertyNFT ugovoru, ovaj ugovor kreira
/// odgovarajući PropertyToken (ERC-20) koji predstavlja udjele u njoj,
/// i vodi evidenciju koja nekretnina ima koji token.
contract TokenFactory is Ownable {
    PropertyNFT public immutable propertyNFT;

    // propertyId (tokenId iz PropertyNFT) => adresa PropertyToken ugovora
    mapping(uint256 => address) public propertyTokenOf;

    event PropertyTokenized(
        uint256 indexed propertyId,
        address indexed tokenAddress,
        uint256 totalShares
    );

    constructor(address _propertyNFT, address initialOwner) Ownable(initialOwner) {
        propertyNFT = PropertyNFT(_propertyNFT);
    }

    /// @notice Registruje novu nekretninu (mint NFT) u ime administratora platforme.
    /// TokenFactory je vlasnik PropertyNFT ugovora (vlasništvo je preneseno prilikom
    /// deploymenta), pa samo TokenFactory moze pozvati mintProperty na PropertyNFT-u.
    /// Ova funkcija je "posrednik" - i dalje je zasticena onlyOwner, pa je samo
    /// administrator platforme (vlasnik TokenFactory-a) moze pozvati.
    function registerProperty(
        address to,
        string calldata location,
        uint256 valuationInWei,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        return propertyNFT.mintProperty(to, location, valuationInWei, metadataURI);
    }

    /// @notice Kreira ERC-20 token za nekretninu koja je već registrovana kao NFT.
    /// @param propertyId ID nekretnine (tokenId u PropertyNFT ugovoru)
    /// @param name_ naziv tokena, npr. "TokenEstate - Stan Banja Luka Centar"
    /// @param symbol_ simbol tokena, npr. "TEBL01"
    /// @param totalShares ukupan broj udjela (npr. 1000 = 100% vlasništva)
    function tokenizeProperty(
        uint256 propertyId,
        string calldata name_,
        string calldata symbol_,
        uint256 totalShares
    ) external onlyOwner returns (address tokenAddress) {
        require(
            propertyNFT.ownerOf(propertyId) != address(0),
            "TokenFactory: nekretnina ne postoji"
        );
        require(
            propertyTokenOf[propertyId] == address(0),
            "TokenFactory: nekretnina je vec tokenizovana"
        );

        address propertyOwner = propertyNFT.ownerOf(propertyId);

        PropertyToken newToken = new PropertyToken(
            propertyId,
            name_,
            symbol_,
            totalShares,
            propertyOwner
        );

        tokenAddress = address(newToken);
        propertyTokenOf[propertyId] = tokenAddress;

        propertyNFT.markAsTokenized(propertyId);

        emit PropertyTokenized(propertyId, tokenAddress, totalShares);
    }
}