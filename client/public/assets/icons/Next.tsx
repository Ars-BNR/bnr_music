import React from "react";
interface NextIconProps {
  onClick?: () => void; // Обработчик клика
  onPointerDown?: () => void; // Обработчик нажатия
  onPointerUp?: () => void; // Обработчик отпускания
}
const NextIcon = ({ onClick, onPointerDown, onPointerUp }: NextIconProps) => {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: "pointer" }}
      onClick={onClick} // Обработчик клика
      onPointerDown={onPointerDown} // Обработчик нажатия
      onPointerUp={onPointerUp} // Обработчик отпускания
    >
      <path
        d="M5.41666 4.33325L16.25 12.9999L5.41666 21.6666V4.33325Z"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5833 5.41675V20.5834"
        stroke="#ECECEF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default NextIcon;
