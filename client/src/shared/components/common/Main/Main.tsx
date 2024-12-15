import React from "react";
type Props = {
  flex?: boolean;
  padding?: boolean;
  maxWidth?: string;
  children?: React.ReactNode;
};

export const Main: React.FC<Props> = ({
  flex = true,
  padding = false,
  maxWidth = "100%",
  children,
}) => {
  return (
    <main
      style={{
        flexGrow: flex ? 1 : undefined,
        // background: "#09090B",
      }}
    >
      <div
        style={{
          maxWidth: maxWidth,
          padding: padding ? "0 15px" : undefined,
          margin: "0 auto",
        }}
      >
        {children}
      </div>
    </main>
  );
};
