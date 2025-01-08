import React from "react";
type props = {
  width?: string;
  height?: string;
};
const Album = ({ width, height }: props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ? width : "26"}
      height={height ? height : "26"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-disc"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
};

export default Album;
