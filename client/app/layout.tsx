import "./globals.css";
import localFont from "next/font/local";
import Providers from "./providers";

const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  src: [
    { path: "../public/assets/fonts/Geist-Regular.woff2", weight: "400" },
    { path: "../public/assets/fonts/Geist-Medium.woff2", weight: "500" },
    { path: "../public/assets/fonts/Geist-Bold.woff2", weight: "700" },
  ],
});

const cinzel = localFont({
  variable: "--font-cinzel",
  display: "swap",
  src: [
    {
      path: "../node_modules/@fontsource/cinzel/files/cinzel-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`dark ${geist.variable} ${cinzel.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
