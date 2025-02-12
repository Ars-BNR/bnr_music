"use client"

import React, { useState } from "react";

interface props{
    reverse?:boolean;
}

const ArrowIcon = ({reverse}:props) => {
    const rotate = reverse ? {transform: "rotate(180deg)" } : {};

    const [isFilled, setIsFilled] = useState(false);
    
      const handleClick = () => {
        setIsFilled(!isFilled);
      };

  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill={isFilled ? "#6300FF" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...rotate,
        cursor: "pointer" 
      }}
      onMouseEnter={handleClick}
      onMouseLeave={handleClick}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.910734 6.58917C0.585297 6.26374 0.585297 5.7361 0.910734 5.41066L5.91073 0.410662C6.23617 0.0852246 6.76381 0.0852246 7.08925 0.410662C7.41468 0.736099 7.41468 1.26374 7.08925 1.58917L2.6785 5.99992L7.08925 10.4107C7.41468 10.7361 7.41468 11.2637 7.08925 11.5892C6.76381 11.9146 6.23617 11.9146 5.91073 11.5892L0.910734 6.58917Z"
        fill={isFilled ? "#6300FF" : "#E1D6D2"}
      />
    </svg>
  );
};

export default ArrowIcon;
