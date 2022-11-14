import "../styles/globals.css";
import type { AppProps } from "next/app";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import Web3 from "web3";
import { useEffect, useState } from "react";

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
    try {
      const account = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const web3 = new Web3(window.ethereum);
      setAccount(account[0]);
      setWeb3(web3);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <>
      <Navbar Web3Handler={Web3Handler} account={account} />
      <Component {...pageProps} Web3Handler={Web3Handler} account={account} />
      <Footer />
    </>
  );
}

export default MyApp;
