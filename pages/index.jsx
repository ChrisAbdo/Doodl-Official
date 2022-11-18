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

  return (
    <>
      {account ? (
        <Marquee
          gradient={false}
          speed={30}
          // left to right
          direction="right"
          className="border-t border-b border-black"
        >
          <div className="stats rounded-none ">
            <div className="stat">
              <div className=" text-black">doodls</div>
              <div className="stat-value text-center">{nfts.length}</div>
            </div>
          </div>
          <div className="stats rounded-none ">
            <div className="stat">
              <div className=" text-black text-center">prize pool (MATIC)</div>
              <div className="stat-value text-center">{prizePool}</div>
            </div>
          </div>
          <div className="stats rounded-none ">
            <div className="stat">
              <div className=" text-black text-center">time remaining</div>
              <div className="stat-value text-center">
                {hours} hours {minutes} minutes
              </div>
            </div>
          </div>
          <div className="stats rounded-none ">
            <div className="stat">
              <div className=" text-black text-center">prompt</div>
              <div className="stat-value text-center">{prompt}</div>
            </div>
          </div>
        </Marquee>
      ) : (
        <div className="stats rounded-none "></div>
      )}
      <div className="hero bg-base-200 pr-12 pl-12 pt-6 pb-6">
        <div className="hero-content flex-col lg:flex-row ">
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
              winner gets 100% of the pot.
            </p>

            {account ? (
              <div>
                <a
                  href="/doodl"
                  className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
                >
                  <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#77dd77] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                  <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#77dd77]"></span>
                  <span className="relative text-black group-hover:text-black">
                    Start doodling!
                  </span>
                </a>
                {minutes > 0 || hours > 0 ? (
                  <div></div>
                ) : (
                  <a
                    href="/vote"
                    className="relative inline-block px-4 py-2 font-medium group cursor-pointer ml-4"
                  >
                    <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#FF6F91] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
                    <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#FF6F91]"></span>
                    <span className="relative text-black group-hover:text-black">
                      vote for your favorite doodl!
                    </span>
                  </a>
                )}
              </div>
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
      ) : null}
      <h1 className="text-4xl font-bold text-center mt-4">Recent Doodls</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-20">
        {nfts.map((nft, i) => (
          <div
            key={i}
            className="border border-black rounded-xl overflow-hidden"
          >
            <Image src={nft.image} width={500} height={500} alt="doodl" />
            <div className="p-4 bg-black">
              <p
                style={{ height: "64px" }}
                className="text-2xl font-bold text-white"
              >
                {nft.name > 10 ? nft.name.substring(0, 14) + "..." : nft.name}
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
