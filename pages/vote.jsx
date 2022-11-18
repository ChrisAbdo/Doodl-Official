import Image from "next/image";
import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import Marketplace from "../backend/build/contracts/Marketplace.json";
import NFT from "../backend/build/contracts/NFT.json";
import Web3 from "web3";
import { useRouter } from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";

const vote = ({ Web3Handler, account }) => {
  const [loading, setLoading] = useState(true);
  const [prizePool, setPrizePool] = useState(0);
  const [web3, setWeb3] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    supply: "",
    royalty: "",
    name: "",
    description: "",
  });
  const [prompt, setPrompt] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timer, setTimer] = useState(0);
  const [vote, setVote] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadBlockchainData();
    loadNFTs();
    getPromptAndTime();
  }, []);

  const projectId = "2FdliMGfWHQCzVYTtFlGQsknZvb";
  const projectSecret = "2274a79139ff6fdb2f016d12f713dca1";
  const auth =
    "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
  const client = ipfsHttpClient({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });

  const IPFSGateway = "https://ipfs.io/ipfs/";

  const loadBlockchainData = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
    } catch (err) {
      console.log(err);
    }
  };

  async function loadNFTs() {
    setLoading(true);

    const web3 = new Web3(window.ethereum);

    const networkId = await web3.eth.net.getId();

    // Get all listed NFTs
    const marketPlaceContract = new web3.eth.Contract(
      Marketplace.abi,
      Marketplace.networks[networkId].address
    );
    const listings = await marketPlaceContract.methods.getListedNfts().call();
    // Iterate over the listed NFTs and retrieve their metadata
    const nfts = await Promise.all(
      listings.map(async (i) => {
        try {
          const NFTContract = new web3.eth.Contract(
            NFT.abi,
            NFT.networks[networkId].address
          );
          const tokenURI = await NFTContract.methods.tokenURI(i.tokenId).call();
          const meta = await axios.get(tokenURI);
          const nft = {
            price: i.price,
            tokenId: i.tokenId,
            seller: i.seller,
            owner: i.buyer,
            image: meta.data.image,
            name: meta.data.name,
            description: meta.data.description,
          };

          const voteCount = await marketPlaceContract.methods
            .getVoteCount(nft.tokenId)
            .call();
          nft.voteCount = voteCount;
          setVoteCount(voteCount);
          console.log(voteCount);

          // update the vote count every 5 seconds to show the latest vote count but don't update the UI
          setInterval(async () => {
            const voteCount = await marketPlaceContract.methods
              .getVoteCount(nft.tokenId)
              .call();
            nft.voteCount = voteCount;
          }, 5000);

          return nft;
        } catch (err) {
          console.log(err);
          return null;
        }
      })
    );
    setNfts(nfts.filter((nft) => nft !== null));
    setLoadingState("loaded");
    setLoading(false);
    // const prizePool should be the highest token id * 0.0001, only display 4 decimals

    const prizePool = nfts.length * 0.0001;
    setPrizePool((nfts.length * 0.0001).toFixed(4));
  }

  async function getPromptAndTime() {
    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();

    // Mint the NFT
    const NFTContractAddress = NFT.networks[networkId].address;
    const NFTContract = new web3.eth.Contract(NFT.abi, NFTContractAddress);
    const accounts = await web3.eth.getAccounts();
    const marketPlaceContract = new web3.eth.Contract(
      Marketplace.abi,
      Marketplace.networks[networkId].address
    );
    const prompt = await marketPlaceContract.methods.getPrompt().call();
    setPrompt(prompt);
    const time = await marketPlaceContract.methods.getTimeLeft().call();
    // convert the time to hours minutes and seconds
    // const minutes = Math.floor(time / 60);
    // setTimer(minutes);
    const hours = Math.floor(time / 3600);
    setHours(hours);
    const minutes = Math.floor((time % 3600) / 60);
    setMinutes(minutes);
    const seconds = Math.floor((time % 3600) % 60);
    setSeconds(seconds);
    setTimer(hours * 60 + minutes);

    // force this component to re-render every second without refreshing the page
    setTimeout(() => {
      getPromptAndTime();
    }, 1000);

    // console log it in a readable format
    console.log(`Prompt: ${prompt}\nTime: ${time}`);
    return prompt;
  }

  // function to vote for nft, uses voteNFT method in marketplace contract
  async function voteNFT(nft) {
    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();
    const marketPlaceContract = new web3.eth.Contract(
      Marketplace.abi,
      Marketplace.networks[networkId].address
    );
    const accounts = await web3.eth.getAccounts();
    const vote = await marketPlaceContract.methods
      .voteNFT(nft.tokenId)
      .send({ from: accounts[0] });
    setVote(vote);
    console.log(vote);
    // loadNFTs();
  }

  // function that gets the vote count for every nft, this uses getVoteCount method in marketplace contract
  async function getVoteCount(nft) {
    const web3 = new Web3(window.ethereum);
    const networkId = await web3.eth.net.getId();
    const marketPlaceContract = new web3.eth.Contract(
      Marketplace.abi,
      Marketplace.networks[networkId].address
    );
    const accounts = await web3.eth.getAccounts();
    const voteCount = await marketPlaceContract.methods
      .getVoteCount(nft.tokenId)
      .call();
    setVoteCount(voteCount);
    console.log(voteCount);
    return voteCount;
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-center mt-4">
        Vote for your favorite doodl!
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-20">
        {nfts.map((nft, i) => (
          <div
            key={i}
            className="border border-black rounded-xl overflow-hidden"
          >
            <Image src={nft.image} width={500} height={500} alt="doodl" />
            <div className="p-4 bg-black">
              <p className="text-2xl font-bold text-white">
                {nft.name > 10 ? nft.name.substring(0, 14) + "..." : nft.name}
              </p>
              <p className="text-2xl font-bold text-white">
                {/* vote count */}
                {nft.voteCount} votes
              </p>

              <button
                onClick={() => voteNFT(nft)}
                className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
              >
                Vote
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default vote;
