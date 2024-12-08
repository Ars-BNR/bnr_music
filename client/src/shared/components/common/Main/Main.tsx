import React from "react";
type Props = {
  flex?: boolean;
  padding?: boolean;
  maxWidth?: string;
  children?: React.ReactNode;
};

export const Main: React.FC<Props> = ({
  flex = true,
  padding = true,
  maxWidth = "1310px",
  children,
}) => {
  return (
    <main
      style={{
        flexGrow: flex ? 1 : undefined,
      }}
    >
      <div
        style={{
          maxWidth: maxWidth,
          padding: padding ? "0 15px" : undefined,
          margin: "0 auto",
          height: "100vh",
        }}
      >
        {children}
      </div>
    </main>
  );
};
