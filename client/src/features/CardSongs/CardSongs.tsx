import React from "react";
import pic from "../../../public/assets/img/17xauRu2mZN83yTqmM7cIZadC87eQVHQN1z9aj0yk8VUovgSx6QP1R3tgGAzywwUJuEaYXzxNzRFf41-USApp8Wl.png";
import Image from "next/image";

const CardSongs = () => {
  return (
    <div className="w-full h-full flex flex-col grow max-w-[142px] p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px]">
      <div className="img">
        <Image src={pic} alt="picture" />
      </div>
      <div className="flex flex-col justify-center items-center gap-[2px]">
        <p className="text-white text-[10px]">Golden Days</p>
        <p className="text-[#B6A295] text-[8px] mb-[4px]">Golden Days</p>
      </div>
    </div>
  );
};

export default CardSongs;
