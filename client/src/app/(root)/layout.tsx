import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BNR | Be Natural Rare",
  description: "Listen how you feel",
};
export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
