import React from "react";
import Wrapper from "../Wrapper/Wrapper";
import { Main } from "../Main/Main";

type Props = {
  children: React.ReactNode;
};

export const ClientWrapper: React.FC<Props> = ({ children }) => {
  return (
    <Wrapper>
      <Main>{children}</Main>
    </Wrapper>
  );
};
