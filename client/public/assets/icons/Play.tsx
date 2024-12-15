import React from "react";
interface props{
  handlePlay:()=>void
}
const PlayIcon = ({handlePlay}:props) => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handlePlay}
      style={{ cursor: "pointer" }}
    >
      <path
        d="M6.5 3.25L21.6667 13L6.5 22.75V3.25Z"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PlayIcon;
