import "../styles/globals.css";
import type { AppProps } from "next/app";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Web3 from "web3";
import { useEffect, useState } from "react";

import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState<Web3>();

  useEffect(() => {
    loadWeb3();
  }, []);

  const loadWeb3 = async () => {
    try {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    } catch (err) {
      console.log(err);
    }
  };

  const Web3Handler = async () => {
    const notification = toast.loading("Connecting account...", {
      style: {
        border: "2px solid #000",
      },
    });
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x13881",
            chainName: "Matic Mumbai Testnet",
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
            blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
          },
        ],
      });
      const account = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const web3 = new Web3(window.ethereum);
      setAccount(account[0]);
      setWeb3(web3);
      toast.success("Account connected", {
        id: notification,
      });
      window.location.reload();
    } catch (err) {
      console.log(err);
      toast.error("Account not connected", {
        id: notification,
      });
    }
  };
  return (
    <>
      <Navbar Web3Handler={Web3Handler} account={account} />
      <Component {...pageProps} Web3Handler={Web3Handler} account={account} />
      <Footer />
      <Toaster />
    </>
  );
}

export default MyApp;
