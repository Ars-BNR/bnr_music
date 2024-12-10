import Search from "@/features/Search/ui/Search";
import Sidebar from "@/features/Sidebar/ui/Sidebar";
import React from "react";

const Home = () => {
  return (
    <div className="flex mx-auto max-w-[1200px]">
      <Sidebar />
      <div className=" flex flex-grow-1 max-w-[894px]">
        <Search />
      </div>
    </div>
  );
};

export default Home;
