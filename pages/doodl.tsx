"use client";

import { FC, useEffect, useState } from "react";
import { useDraw } from "../hooks/useDraw";
import { ChromePicker } from "react-color";
import { useRouter } from "next/router";

import Marketplace from "../backend/build/contracts/Marketplace.json";
import NFT from "../backend/build/contracts/NFT.json";

import Web3 from "web3";
import { create as ipfsHttpClient } from "ipfs-http-client";

import toast from "react-hot-toast";

interface pageProps {}

const Page: FC<pageProps> = ({}) => {
  const ipfsClient = require("ipfs-http-client");
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
  const [color, setColor] = useState<string>("#000");
  const { canvasRef, onMouseDown, clear } = useDraw(drawLine);
  const [width, setWidth] = useState<number>();
  const [account, setAccount] = useState<string>();
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  // create a timer that uses the time
  const [timer, setTimer] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [fileUrl, setFileUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });
  const router = useRouter();

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

  const loadBlockchainData = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

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

  async function onChange(e) {
    // upload image to IPFS
    const file = e.target.files[0];

    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `${IPFSGateway}${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function uploadToIPFS() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) {
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

  // create a function that takes id="canvas" and returns an ipfs hash
  async function uploadCanvas() {
    const canvas = document.getElementById("canvas");
    const dataURL = canvas.toDataURL();
    const blob = await fetch(dataURL).then((r) => r.blob());
    const file = new File([blob], "image.png", { type: "image/png" });
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `${IPFSGateway}${added.path}`;
      console.log(url);
      return url;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  }

  async function listNFTForSale() {
    const notification = toast.loading(
      "Please confirm both transactions to create doodl...",
      {
        style: {
          border: "2px solid #000",
        },
      }
    );

    try {
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
              Web3.utils.toWei(formInput.price, "ether")
            )
            .send({ from: accounts[0], value: listingFee })
            .on("receipt", function () {
              console.log("listed");
              toast.success("doodl listed successfully!", {
                id: notification,
                style: {
                  border: "2px solid #000",
                },
              });
              setTimeout(() => {
                // take the user to the / page
                window.location.href = "/";
              }, 3000);
            });
        });
    } catch (err) {
      console.log(err);
      toast.error("Error listing doodl. Please fill out the form correctly.", {
        id: notification,
        style: {
          border: "2px solid #000",
        },
      });
    }
  }

  const downloadCanvas = () => {
    const canvas = document.getElementById("canvas");
    const image = canvas
      .toDataURL("image/png", 1.0)
      .replace("image/png", "image/octet-stream");
    const link = document.createElement("a");
    link.download = "my-image.png";
    link.href = image;
    link.click();
    toast.success("Canvas downloaded!", {
      style: {
        border: "2px solid #000",
      },
    });
  };

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
                  defaultValue={5}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                />
                {/* little p tag that says the value of the stroke width */}
                <p className="text-center">{width}</p>
              </div>
              <button
                type="button"
                className="p-2 rounded-md border border-black btn btn-outline"
                onClick={() => {
                  clear();
                  toast.success("Canvas cleared!", {
                    style: {
                      border: "2px solid #000",
                    },
                  });
                }}
              >
                clear
              </button>

              <label
                htmlFor="my-modal-6"
                className="p-2 rounded-md border border-black text-center cursor-pointer btn btn-outline"
              >
                submit!
              </label>
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

      <input type="checkbox" id="my-modal-6" className="modal-toggle" />
      <div className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <div className="flex flex-col gap-2">
            <label htmlFor="price">
              please confirm the following
              {/* span red asterisk */}
              <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="wallet address or ENS (automatically resolved)"
              className="input input-bordered border rounded"
              onChange={(e) =>
                updateFormInput({ ...formInput, name: e.target.value })
              }
            />

            <input
              placeholder="What is the prompt of the day?"
              className="mt-2 input input-bordered rounded p-4"
              required
              onChange={(e) =>
                updateFormInput({ ...formInput, description: e.target.value })
              }
            />
            <input
              placeholder="Asset Price in MATIC if you win :)"
              // require it to say 5
              required
              className="mt-2 border rounded p-4 input input-bordered"
              onChange={(e) =>
                updateFormInput({ ...formInput, price: e.target.value })
              }
            />
            <label htmlFor="price">
              For regulatory purposes, please manually import your doodl <br />
              1. Click the "download" button below, this will automatically
              download your stem as a png file <br />
              2. Choose the file you just downloaded <br />
              3. Click "submit" <br />
              4. Wait for the voting period!
            </label>
            <div
              onClick={downloadCanvas}
              className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
            >
              <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#A7C7E7] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
              <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#A7C7E7]"></span>
              <span className="relative text-black group-hover:text-black">
                Download
              </span>
            </div>
            <input
              type="file"
              name="Asset"
              className="my-4"
              onChange={onChange}
              required
            />
            <label className="text-center" htmlFor="price">
              BE ALERT: ALL DOODLS WILL BE VERIFIED.
            </label>
            <div
              onClick={listNFTForSale}
              className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
            >
              <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#FF6F91] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
              <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#FF6F91]"></span>
              <span className="relative text-black group-hover:text-black">
                Submit
              </span>
            </div>
          </div>
          <div className="modal-action">
            <label htmlFor="my-modal-6" className="btn">
              cancel
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
