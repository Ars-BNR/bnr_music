"use client";

import { ClientWrapper } from "@/shared/components/common/ClientWrapper/ClientWrapper";
import "./globals.css";
import Providers from "./providers";
import AuthStore from "@/shared/store/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const checkAuth = AuthStore((state) => state.checkAuth);
  const isLoading = AuthStore((state) => state.isLoading);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth(router);
    } else {
      router.replace("/login");
    }
  }, []);
  return (
    <html lang="en">
      <head></head>
      <body>
        {isLoading ? (
          <h1>Somithing neeed loading</h1>
        ) : (
          <ClientWrapper>
            <Providers>{children}</Providers>
          </ClientWrapper>
        )}
      </body>
    </html>
  );
}
