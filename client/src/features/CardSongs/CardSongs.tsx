import React from "react";
import pic from "../../../public/assets/img/17xauRu2mZN83yTqmM7cIZadC87eQVHQN1z9aj0yk8VUovgSx6QP1R3tgGAzywwUJuEaYXzxNzRFf41-USApp8Wl.png";
// import pic from "../../../public/assets/img/ac2JPG.jpg";
import Image from "next/image";

interface props {
  nameSong: string;
  nameArt: string;
}
const CardSongs = ({ nameArt, nameSong }: props) => {
  return (
    <div className="cursor-pointer flex flex-col grow max-w-[142px] max-h-[184px] p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300">
      <div className="rounded-[4px]">
        <Image src={pic} alt="picture" />
      </div>
      <div className="flex flex-col justify-center items-center gap-[2px]">
        <p className="text-white text-[10px]">{nameSong}</p>
        <p className="text-[#B6A295] text-[8px] mb-[4px]">{nameArt}</p>
      </div>
    </div>
  );
};

export default CardSongs;
