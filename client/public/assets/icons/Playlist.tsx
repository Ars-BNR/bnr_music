import React from "react";
type props = {
  width?: string;
  height?: string;
};
const PlaylistIcon = ({ width, height }: props) => {
  return (
    <svg
      width={width ? width : "26"}
      height={height ? height : "26"}
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.75 16.25V6.5"
        stroke="#E1D6D2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.0417 19.4999C20.76 19.4999 21.4488 19.2146 21.9567 18.7067C22.4647 18.1988 22.75 17.5099 22.75 16.7916C22.75 16.0733 22.4647 15.3844 21.9567 14.8765C21.4488 14.3686 20.76 14.0833 20.0417 14.0833C19.3234 14.0833 18.6345 14.3686 18.1266 14.8765C17.6187 15.3844 17.3333 16.0733 17.3333 16.7916C17.3333 17.5099 17.6187 18.1988 18.1266 18.7067C18.6345 19.2146 19.3234 19.4999 20.0417 19.4999Z"
        stroke="#E1D6D2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 13H3.25"
        stroke="#E1D6D2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.3333 6.5H3.25"
        stroke="#E1D6D2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 19.5H3.25"
        stroke="#E1D6D2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PlaylistIcon;
