import React from "react";
interface BackIconProps {
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
}
const BackIcon = ({ onClick, onPointerDown, onPointerUp }: BackIconProps) => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: "pointer" }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <path
        d="M20.5835 21.6667L9.75013 13.0001L20.5835 4.33342V21.6667Z"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.41678 20.5833V5.41659"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BackIcon;
