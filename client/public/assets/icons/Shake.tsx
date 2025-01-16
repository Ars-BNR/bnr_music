"use client";

import React from "react";
type Props = {
  isActive?: boolean;
  onClick?: () => void;
};
const ShakeIcon = ({ onClick, isActive }: Props) => {
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
        d="M2.16669 19.5H3.68335C5.09169 19.5 6.39169 18.85 7.25835 17.6583L13.8667 8.34167C14.625 7.15 16.0334 6.5 17.4417 6.5H23.8334"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M19.5 2.16675L23.8333 6.50008L19.5 10.8334"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M2.16669 6.5H4.22502C5.85002 6.5 7.36669 7.475 8.12502 8.88333"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M23.8333 19.5H17.4416C16.0333 19.5 14.625 18.7417 13.8666 17.55L13.325 16.6833"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
      <path
        d="M19.5 15.1667L23.8333 19.5001L19.5 23.8334"
        stroke={isActive ? "#6300FF" : "#EAECEC"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "fill-animation" : ""}
      />
    </svg>
  );
};

export default ShakeIcon;
