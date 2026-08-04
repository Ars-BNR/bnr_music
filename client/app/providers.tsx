"use client";

import React from "react";
import { NavigationLoadingProvider } from "@/_app/navigation/NavigationLoadingProvider";

const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <NavigationLoadingProvider>{children}</NavigationLoadingProvider>;
};
export default Providers;
