import React from "react";

type TitleProps = {
  children: React.ReactNode;
  className?: string;
};

const Title: React.FC<TitleProps> = ({ children, className = "", ...props }) => {
  return (
    <h1
      className={`bg-gradient-to-r from-[#9153cb] to-[#e1d6d2] bg-clip-text text-transparent ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
};

export default Title;