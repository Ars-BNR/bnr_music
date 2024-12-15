import React from "react";
interface props{
    handlePlay:()=>void
  }
const PauseIcon = ({handlePlay}:props) => {
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
        d="M18.4165 4.33334H16.2498C15.6515 4.33334 15.1665 4.81837 15.1665 5.41668V20.5833C15.1665 21.1817 15.6515 21.6667 16.2498 21.6667H18.4165C19.0148 21.6667 19.4998 21.1817 19.4998 20.5833V5.41668C19.4998 4.81837 19.0148 4.33334 18.4165 4.33334Z"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 4.33334H7.58333C6.98502 4.33334 6.5 4.81837 6.5 5.41668V20.5833C6.5 21.1817 6.98502 21.6667 7.58333 21.6667H9.75C10.3483 21.6667 10.8333 21.1817 10.8333 20.5833V5.41668C10.8333 4.81837 10.3483 4.33334 9.75 4.33334Z"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PauseIcon;
