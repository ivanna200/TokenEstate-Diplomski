import { ethers } from "ethers";
import PropertyNFTArtifact from "../contracts/abis/PropertyNFT.json";
import { CONTRACT_ADDRESSES } from "../contracts/addresses";
import { getTokenFactoryContract } from "./tokenFactoryService";

export function getPropertyNFTContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESSES.PropertyNFT, PropertyNFTArtifact.abi, signerOrProvider);
}

// Mint ide kroz TokenFactory, jer je TokenFactory vlasnik PropertyNFT ugovora
// (vlasnistvo je preneseno prilikom deploymenta, da bi TokenFactory mogao
// pozivati markAsTokenized nakon tokenizacije).
export async function mintProperty(signer, { to, location, valuationInEth, metadataURI }) {
  const contract = getTokenFactoryContract(signer);
  const valuationInWei = ethers.parseEther(String(valuationInEth));
  const tx = await contract.registerProperty(to, location, valuationInWei, metadataURI);
  return tx.wait();
}

// Nema ERC721Enumerable ekstenziju, pa listu nekretnina dobijamo
// citanjem istorije PropertyMinted dogadjaja umjesto totalSupply() poziva.
export async function fetchAllProperties(provider) {
  const contract = getPropertyNFTContract(provider);
  const mintedEvents = await contract.queryFilter(contract.filters.PropertyMinted());

  return Promise.all(
    mintedEvents.map(async (event) => {
      const tokenId = event.args.tokenId;
      const data = await contract.properties(tokenId);
      const owner = await contract.ownerOf(tokenId);
      return {
        tokenId: tokenId.toString(),
        owner,
        location: data.location,
        valuationInWei: data.valuationInWei,
        metadataURI: data.metadataURI,
        isTokenized: data.isTokenized,
      };
    })
  );
}

export async function fetchProperty(provider, tokenId) {
  const contract = getPropertyNFTContract(provider);
  const data = await contract.properties(tokenId);
  const owner = await contract.ownerOf(tokenId);
  return {
    tokenId: String(tokenId),
    owner,
    location: data.location,
    valuationInWei: data.valuationInWei,
    metadataURI: data.metadataURI,
    isTokenized: data.isTokenized,
  };
}