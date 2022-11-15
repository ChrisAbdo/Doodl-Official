import Image from "next/image";
import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import Marketplace from "../backend/build/contracts/Marketplace.json";
import NFT from "../backend/build/contracts/NFT.json";
import Web3 from "web3";
import { useRouter } from "next/router";
import axios from "axios";
import { create as ipfsHttpClient } from "ipfs-http-client";

const index = ({ Web3Handler, account }) => {
  const [loading, setLoading] = useState(true);
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
  const router = useRouter();

  useEffect(() => {
    loadBlockchainData();
    loadNFTs();
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
  }

  async function buyNft(nft) {
    // const notification = toast.loading("Buying Stem...");
    // black border toast notification

    try {
      const web3 = new Web3(window.ethereum);

      const networkId = await web3.eth.net.getId();
      const marketPlaceContract = new web3.eth.Contract(
        Marketplace.abi,
        Marketplace.networks[networkId].address
      );
      const accounts = await web3.eth.getAccounts();
      await marketPlaceContract.methods
        .buyNft(NFT.networks[networkId].address, nft.tokenId)
        .send({ from: accounts[0], to: nft.seller, value: nft.price });

      loadNFTs();
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <>
      <div className="hero bg-base-200 pr-12 pl-12 pt-6 pb-6">
        <div className="hero-content flex-col lg:flex-row">
          <Image src="/paint.png" width={500} height={500} alt="paint" />
          <div>
            <div className="flex flex-col space-y-2 text-5xl sm:text-6xl font-bold">
              <h1 className="font-bold">
                <span className="text-[#FF6F91]">one</span>
                &nbsp;prompt.
              </h1>
              <h1 className="font-bold">
                <span className="text-[#8D80C4]">one</span>
                &nbsp;day.
              </h1>
              <h1 className="font-bold">
                <span className="text-[#3ace3a]">one</span>
                &nbsp;winner.
              </h1>
            </div>
            <p className="py-6 text-2xl">
              doodl is a blockchain based art competition where you draw the
              weekly prompt and the community votes on the best submission.
            </p>

            {account ? (
              <a
                href="/doodl"
                className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
              >
                <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#FF6F91] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#FF6F91]"></span>
                <span className="relative text-black group-hover:text-black">
                  Start doodling!
                </span>
              </a>
            ) : (
              <div
                onClick={Web3Handler}
                className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
              >
                <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#FF6F91] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#FF6F91]"></span>
                <span className="relative text-black group-hover:text-black">
                  connect wallet to start doodling!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <Marquee
        gradient={false}
        speed={30}
        className="bg-black text-7xl text-center pt-10 pb-10 text-white"
      >
        &nbsp;
        <h1 className="font-bold">
          one&nbsp;
          <span className="text-[#FF6F91]">prompt.</span>
        </h1>
        &nbsp;
        <h1 className="font-bold">
          one&nbsp;
          <span className="text-[#8D80C4]">day.</span>
        </h1>
        &nbsp;
        <h1 className="font-bold">
          one&nbsp;
          <span className="text-[#3ace3a]">winner.</span>
        </h1>
        &nbsp;
        <h1 className="font-bold">
          one&nbsp;
          <span className="text-[#FF6F91]">prompt.</span>
        </h1>
        &nbsp;
        <h1 className="font-bold">
          one&nbsp;
          <span className="text-[#8D80C4]">day.</span>
        </h1>
        &nbsp;
        <h1 className="font-bold">
          one&nbsp;
          <span className="text-[#3ace3a]">winner.&nbsp;</span>
        </h1>
        &nbsp;
      </Marquee>

      {/* map the nfts in a grid with columns, they should fill up in rows as they come in */}
      {loading ? (
        <div class="flex justify-center items-center mt-12  space-x-2">
          <div
            class="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-blue-600"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <div
            class="
      spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0
        text-purple-500
      "
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <div
            class="
      spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0
        text-green-500
      "
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <div
            class="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-red-500"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <div
            class="
      spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0
        text-yellow-500
      "
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <div
            class="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-blue-300"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
          <div
            class="spinner-grow inline-block w-8 h-8 bg-current rounded-full opacity-0 text-gray-300"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : null}
      <h1 className="text-4xl font-bold text-center mt-4">Recent Doodls</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-20">
        {nfts.map((nft, i) => (
          <div key={i} className="border shadow rounded-xl overflow-hidden">
            <Image src={nft.image} width={500} height={500} />
            <div className="p-4 bg-black">
              <p
                style={{ height: "64px" }}
                className="text-2xl font-bold text-white"
              >
                {nft.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default index;

{
  /* <div className="flex flex-col space-y-2 text-5xl sm:text-6xl font-bold">
        <h1 className="font-bold">
          <span className="text-[#FF6F91]">One</span>
          &nbsp;Prompt.
        </h1>
        <h1 className="font-bold">
          <span className="text-[#8D80C4]">One</span>
          &nbsp;Week.
        </h1>
        <h1 className="font-bold">
          <span className="text-[#3ace3a]">One</span>
          &nbsp;Winner.
        </h1>
      </div> */
}
