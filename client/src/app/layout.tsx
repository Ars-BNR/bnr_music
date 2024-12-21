import { ClientWrapper } from "@/shared/components/common/ClientWrapper/ClientWrapper";
import "./globals.css";
import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
