import Player from "@/features/Player/Player";
import Profiles from "@/features/Profiles/ui/Profiles";
import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
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
  return (
    <div className="flex bg-[#09090B]">
      <div
        style={{
          width: "100%",
        }}
        className="flex h-full mx-auto max-w-[1200px] gap-[24px] mt-[50px] pb-[200px]"
      >
        <Sidebar />

        <div className="w-full flex flex-col max-w-[894px]">
          <div className="flex items-center mb-[52px] max-h-[58px] grow justify-between ">
            <Search />

            <Profiles />
          </div>
          {children}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full shadow-lg ">
        <div className="mx-auto max-w-[1200px]">
          <Player />
        </div>
      </div>
    </div>
  );
}
