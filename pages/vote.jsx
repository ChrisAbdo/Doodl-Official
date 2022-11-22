import Image from "next/image";
import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import Marketplace from "../backend/build/contracts/Marketplace.json";
import NFT from "../backend/build/contracts/NFT.json";
import Web3 from "web3";
import { useRouter } from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";
import toast from "react-hot-toast";
import { client, exploreProfiles } from "../api";
import Head from "next/head";
import Script from "next/script";
import { LensShareButton } from "@infinity-keys/react-lens-share-button";
import "@infinity-keys/react-lens-share-button/dist/style.css";

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
  const [profiles, setProfiles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadBlockchainData();
    loadNFTs();
    getPromptAndTime();
    fetchProfiles();
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

  async function fetchProfiles() {
    try {
      /* fetch profiles from Lens API */
      let response = await client.query({ query: exploreProfiles });
      /* loop over profiles, create properly formatted ipfs image links */
      let profileData = await Promise.all(
        response.data.exploreProfiles.items.map(async (profileInfo) => {
          let profile = { ...profileInfo };
          let picture = profile.picture;
          if (picture && picture.original && picture.original.url) {
            if (picture.original.url.startsWith("ipfs://")) {
              let result = picture.original.url.substring(
                7,
                picture.original.url.length
              );
              profile.avatarUrl = `http://lens.infura-ipfs.io/ipfs/${result}`;
            } else {
              profile.avatarUrl = picture.original.url;
            }
          }
          return profile;
        })
      );

      /* update the local state with the profiles array */
      setProfiles(profileData);
    } catch (err) {
      console.log({ err });
    }
  }

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

    return prompt;
  }

  // function to vote for nft, uses voteNFT method in marketplace contract
  async function voteNFT(nft) {
    const notification = toast.loading("Submitting vote...", {
      style: {
        border: "2px solid #000",
      },
    });

    try {
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
      toast.success("Thank you for voting!", {
        id: notification,
        style: {
          border: "2px solid #000",
        },
      });
      // wait 5 seconds and then refresh the page after voting
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (err) {
      console.log(err);
      toast.error("Error voting!", {
        id: notification,
        style: {
          border: "2px solid #000",
        },
      });
    }
  }

  return (
    <>
      <Script src="https://lens.xyz/widget.js" />
      <link rel="stylesheet" href="https://lens.xyz/widget-styles.css" />

      <h1 className="text-4xl font-bold text-center mt-4">
        Vote for your favorite doodl!
      </h1>

      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="w-2/3 shadow-md p-6 rounded-lg mb-8 flex flex-col items-center"
        >
          <img
            className="w-48"
            src={profile.avatarUrl || "https://picsum.photos/200"}
          />
          <p className="text-xl text-center mt-6">{profile.name}</p>
          <p className="text-base text-gray-400  text-center mt-2">
            {profile.bio}
          </p>
          <Link href={`/profile/${profile.handle}`}>
            <p className="cursor-pointer text-violet-600 text-lg font-medium text-center mt-2 mb-2">
              {profile.handle}
            </p>
          </Link>
          <p className="text-pink-600 text-sm font-medium text-center">
            {profile.stats.totalFollowers} followers
          </p>
        </div>
      ))}

      {loading ? (
        <div className="flex justify-center items-center mt-12  space-x-2">
          <div
            className="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-blue-600"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="
      spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0
        text-purple-500
      "
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="
      spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0
        text-green-500
      "
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-red-500"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="
      spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0
        text-yellow-500
      "
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-blue-300"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div
            className="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-gray-300"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-20">
          {nfts.map((nft, i) => (
            <div
              key={i}
              className="border border-black rounded-xl overflow-hidden"
            >
              <Image src={nft.image} width={600} height={600} alt="doodl" />
              <div className="p-4 border-t border-black">
                <p className="text-2xl font-bold ">
                  {nft.name > 10 ? nft.name.substring(0, 14) + "..." : nft.name}
                </p>
                <p className="text-2xl font-bold ">
                  {/* vote count */}
                  {/* {nft.voteCount} votes */}
                  {/* if it has 1 vote, say vote, but if it has more than one, say votes */}
                  {nft.voteCount} votes
                </p>

                <button
                  onClick={() => voteNFT(nft)}
                  className="relative inline-block px-4 py-2 font-medium group cursor-pointer w-full mt-2"
                >
                  <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#77dd77] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                  <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#77dd77]"></span>
                  <span className="relative text-black group-hover:text-black">
                    vote!
                  </span>
                </button>
                {/* <LensShareButton
                  postBody="Hello, Lens!"
                  url="https://lens.xyz"
                  via="lensprotocol"
                  hashtags="react,js"
                  preview={true}
                />
                <span id="lens-follow-small" data-handle="chrisabdo.lens" /> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default vote;
