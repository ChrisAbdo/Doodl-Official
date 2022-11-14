import Image from "next/image";
import React from "react";
import Marquee from "react-fast-marquee";

const index = ({ Web3Handler, account }) => {
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
