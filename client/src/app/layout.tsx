"use client";

import { ClientWrapper } from "@/shared/components/common/ClientWrapper/ClientWrapper";
import "./globals.css";
import Providers from "./providers";
import AuthStore from "@/shared/store/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const checkAuth = AuthStore((state) => state.checkAuth);
  const isLoading = AuthStore((state) => state.isLoading);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkAuth(router).finally(() => setIsAuthChecked(true));
    } else {
      router.replace("/login");
    }
  }, []);
  if (!isAuthChecked || isLoading) {
    return (
      <html lang="en">
        <head></head>
        <body>
          <ClientWrapper>
            <h1>Loading...</h1>
          </ClientWrapper>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head></head>
      <body>
        <ClientWrapper>
          <Providers>{children}</Providers>
        </ClientWrapper>
      </body>
    </html>
  );
}
