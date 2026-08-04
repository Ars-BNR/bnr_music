import { Player } from "@/features/Player";
import { Profiles } from "@/features/Profiles";
import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
import type { Metadata } from "next";
import { AuthGate } from "@/_app/auth/AuthGate";

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
    <AuthGate>
      <div className="min-h-dvh bg-background">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-3 pb-[228px] pt-3 sm:px-5 sm:pb-[200px] md:flex-row md:gap-4 md:pt-6 lg:gap-6">
          <Sidebar />

          <main className="flex min-w-0 w-full max-w-[894px] flex-col">
            <div className="mb-8 flex flex-col gap-4 sm:mb-[52px] sm:max-h-[58px] sm:flex-row sm:items-center sm:justify-between">
              <Search />
              <Profiles />
            </div>
            {children}
          </main>
        </div>
        <div className="fixed bottom-0 left-0 w-full shadow-lg">
          <div className="mx-auto max-w-[1200px] bg-background">
            <Player />
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
