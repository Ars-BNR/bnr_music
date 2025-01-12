"use client";

import React from "react";

type Props = {
  width?: string;
  height?: string;
  isFilled?: boolean;
  onClick?: () => void;
};

const LoveIcon = ({ width, height, isFilled, onClick }: Props) => {
  return (
    <svg
      width={width ? width : "26"}
      height={height ? height : "26"}
      viewBox="0 0 26 26"
      fill={isFilled ? "#6300FF" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <path
        d="M19.85 14.6111C21.4145 13.07 23 11.2228 23 8.80556C23 7.26583 22.3916 5.78916 21.3085 4.70041C20.2255 3.61166 18.7566 3 17.225 3C15.377 3 14.075 3.52778 12.5 5.11111C10.925 3.52778 9.623 3 7.775 3C6.24337 3 4.77448 3.61166 3.69146 4.70041C2.60844 5.78916 2 7.26583 2 8.80556C2 11.2333 3.575 13.0806 5.15 14.6111L12.5 22L19.85 14.6111Z"
        stroke="#C9CACB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isFilled ? "fill-animation" : ""}
      />
    </svg>
  );
};

export default LoveIcon;
