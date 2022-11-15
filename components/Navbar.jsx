import Image from "next/image";
import React from "react";

const Navbar = ({ Web3Handler, account }) => {
  return (
    <>
      <div className="navbar  pr-7 pl-5 sticky top-0 z-50 bg-white">
        <div className="navbar-start">
          <Image
            src="/logo.png"
            width={50}
            height={50}
            alt="logo"
            className="rounded-full"
          />
          <a href="/" className="text-4xl font-bold">
            doodl
          </a>
        </div>

        <div className="navbar-end ">
          <div
            onClick={Web3Handler}
            className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-[#FF6F91] border-black border-[2px] group-hover:-translate-x-0 group-hover:-translate-y-0"></span>
            <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-[#FF6F91]"></span>
            <span className="relative text-black group-hover:text-black">
              {account
                ? account.slice(0, 5) + "..." + account.slice(-4)
                : "Connect Wallet"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
