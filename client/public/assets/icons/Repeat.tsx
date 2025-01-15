"use client";

import React from "react";
type Props = {
  isActive?: boolean;
  onClick?: () => void;
};
const RepeatIcon = ({ onClick, isActive }: Props) => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill={isActive ? "#6300FF" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <path
        d="M18.4166 2.16675L22.75 6.50008L18.4166 10.8334"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M3.25 11.9167V10.8333C3.25 9.68406 3.70655 8.58186 4.5192 7.7692C5.33186 6.95655 6.43406 6.5 7.58333 6.5H22.75"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M7.58333 23.8334L3.25 19.5001L7.58333 15.1667"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M22.75 14.0833V15.1666C22.75 16.3159 22.2935 17.4181 21.4808 18.2307C20.6681 19.0434 19.5659 19.4999 18.4167 19.4999H3.25"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
    </svg>
  );
};

export default RepeatIcon;
