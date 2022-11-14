"use client";

import { FC, useEffect, useState } from "react";
import { useDraw } from "../hooks/useDraw";
import { ChromePicker } from "react-color";
import { useRouter } from "next/router";

import Marketplace from "../backend/build/contracts/Marketplace.json";
import NFT from "../backend/build/contracts/NFT.json";

import Web3 from "web3";

interface pageProps {}

const Page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>("#000");
  const { canvasRef, onMouseDown, clear } = useDraw(drawLine);
  const [width, setWidth] = useState<number>();
  const [account, setAccount] = useState<string>();
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");
  const [fileUrl, setFileUrl] = useState(null);
  // create a timer that uses the time
  const [timer, setTimer] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [formInput, updateFormInput] = useState({
    price: "",
    supply: "",
    royalty: "",
    name: "",
    description: "",
  });
  const router = useRouter();

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  function drawLine({ prevPoint, currentPoint, ctx }: Draw) {
    const { x: currX, y: currY } = currentPoint;
    const lineColor = color;
    const lineWidth: any = width;

    let startPoint = prevPoint ?? currentPoint;
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  useEffect(() => {
    loadBlockchainData();
    getPromptAndTime();
  }, [account]);

  const ipfsClient = require("ipfs-http-client");
  const projectId = "2FdliMGfWHQCzVYTtFlGQsknZvb";
  const projectSecret = "2274a79139ff6fdb2f016d12f713dca1";
  const auth =
    "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
  const client = ipfsClient.create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });

  const loadBlockchainData = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

  async function onChange(e) {
    // upload image to IPFS
    const file = e.target.files[0];
    try {
      const added = await client.add(file, {
        progress: (prog: any) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.io/ipfs/${added.path}`;
      console.log(url);
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function uploadToIPFS() {
    const { name, description, price, supply, royalty } = formInput;
    if (!name || !description || !price || !supply || !royalty || !fileUrl) {
      return;
    } else {
      // first, upload metadata to IPFS
      const data = JSON.stringify({
        name,
        description,
        image: fileUrl,
      });
      try {
        const added = await client.add(data);
        const url = `https://ipfs.io/ipfs/${added.path}`;
        // after metadata is uploaded to IPFS, return the URL to use it in the transaction
        return url;
      } catch (error) {
        console.log("Error uploading file: ", error);
      }
    }
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

    // force this component to re-render every minute without refreshing the page
    setTimeout(() => {
      getPromptAndTime();
    }, 60000);

    // console log it in a readable format
    console.log(`Prompt: ${prompt}\nTime: ${time}`);
    return prompt;
  }

  async function listNFTForSale() {
    try {
      // const web3Modal = new Web3Modal();
      // const provider = await web3Modal.connect();
      // const web3 = new Web3(provider);
      // const url = await uploadToIPFS();
      // const networkId = await web3.eth.net.getId();

      // do the code above but do not use web3Modal
      const web3 = new Web3(window.ethereum);
      const provider = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const url = await uploadToIPFS();
      const networkId = await web3.eth.net.getId();

      // Mint the NFT
      const NFTContractAddress = NFT.networks[networkId].address;
      const NFTContract = new web3.eth.Contract(NFT.abi, NFTContractAddress);
      const accounts = await web3.eth.getAccounts();
      const marketPlaceContract = new web3.eth.Contract(
        Marketplace.abi,
        Marketplace.networks[networkId].address
      );
      let listingFee = await marketPlaceContract.methods.getListingFee().call();
      listingFee = listingFee.toString();
      setLoading(true);
      NFTContract.methods
        .mint(url)
        .send({ from: accounts[0] })
        .on("receipt", function (receipt) {
          console.log("minted");
          // List the NFT
          const tokenId = receipt.events.NFTMinted.returnValues[0];
          marketPlaceContract.methods
            .listNft(
              NFTContractAddress,
              tokenId,
              Web3.utils.toWei(formInput.price, "ether"),
              formInput.supply,
              formInput.royalty
            )
            .send({ from: accounts[0], value: listingFee })
            .on("receipt", function () {
              console.log("listed");
              // toast.success("Stem created", { id: notification });
              // create a custom toast that has a black border 2px
              toast.success("NFT listed", {
                id: notification,
                style: {
                  border: "2px solid #000",
                },
              });

              setLoading(false);
              // wait 2 seconds, then reload the page
              setTimeout(() => {
                router.push("/marketplace");
              }, 2000);
            });
        });
    } catch (error) {
      console.log(error);
      toast.error("Error creating stem", { id: notification });
    }
  }

  // const downloadCanvas = () => {
  //   const canvas = document.getElementById("canvas");
  //   const image = canvas
  //     .toDataURL("image/png", 1.0)
  //     .replace("image/png", "image/octet-stream");
  //   const link = document.createElement("a");
  //   link.download = "my-image.png";
  //   link.href = image;
  //   link.click();
  // };

  return (
    <>
      <div className="flex items-center text-center justify-center">
        <div className="card w-96 bg-base-100 border border-black text-center items-center">
          <div className="card-body text-center  justify-center items-center">
            <h2 className="card-title font-extrabold">PROMPT:</h2>
            <h2 className="card-title text-2xl">{prompt}</h2>

            <br />
            <h2 className="card-title">TIME REMAINING:</h2>

            <div className=" items-center justify-center grid grid-flow-col gap-5 text-center auto-cols-max">
              <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span className="countdown font-mono text-5xl">
                  <span style={{ "--value": hours }}>{hours}</span>
                </span>
                hours
              </div>
              <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span className="countdown font-mono text-5xl">
                  <span style={{ "--value": minutes }}>{minutes}</span>
                </span>
                minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero  bg-base-200">
        <div className="hero-content flex-col lg:flex-row">
          <div className=" bg-white flex  justify-center py-12 pl-12">
            <div className="flex flex-col gap-10 pr-10">
              <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
              <div className="flex flex-col gap-2">
                <label htmlFor="strokeWidth">Stroke Width</label>
                <input
                  id="strokeWidth"
                  type="range"
                  min="0"
                  max="100"
                  className="range"
                  defaultValue={10}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                />
              </div>
              <button
                type="button"
                className="p-2 rounded-md border border-black"
                onClick={clear}
              >
                Clear
              </button>

              <button
                type="button"
                className="p-2 rounded-md border border-black"
              >
                Mint!
              </button>
            </div>
          </div>
          <div>
            {/* responsive canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={onMouseDown}
              width={500}
              height={500}
              className="border border-black rounded-md"
              id="canvas"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
