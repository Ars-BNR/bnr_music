"use client";

import React, { useEffect } from "react";
import stl from "../styles/Sidebar.module.scss";
import { useRouter } from "next/navigation";
import Title from "@/shared/components/common/Title/Title";
import Link from "next/link";
import HomeIcon from "../../../../public/assets/icons/Home";
import CategoryIcon from "../../../../public/assets/icons/Category";
import ArtistIcon from "../../../../public/assets/icons/Artist";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import PlaylistIcon from "../../../../public/assets/icons/Playlist";
import ExitIcon from "../../../../public/assets/icons/Exit";
import AuthStore from "@/shared/store/auth";
import useCollectionStore from "@/shared/store/collection";
export const Sidebar = () => {
  const router = useRouter();
  const logout = AuthStore((state) => state.logout);
  const handleLogout = async () => {
    try {
      logout(router);
    } catch (error) {
      console.log(error);
    }
  };
  const links = [
    { href: "/", icon: <HomeIcon />, text: "Главная" },
    { href: "/category", icon: <CategoryIcon />, text: "Категории" },
    { href: "/authors", icon: <ArtistIcon />, text: "Артисты" },
  ];
  const idCollection = Number(localStorage.getItem("collection"));
  const { userPlaylist, getUserPlaylists } = useCollectionStore();
  useEffect(() => {
    if (idCollection !== null) {
      getUserPlaylists(idCollection);
    }
  }, []);
  return (
    <div className={stl.sidebar}>
      <div className="cursor-pointer" onClick={() => router.replace("/")}>
        <Title className="text-[20px] mb-6">BNR - Be Natural Rare</Title>
      </div>
      <div className={stl.links__list}>
        {links.map((link, index) => (
          <Link key={index} href={link.href} className={stl.sidebar__el}>
            {link.icon}
            <span className="text-[20px]">{link.text}</span>
          </Link>
        ))}

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <div className="flex items-center gap-3  mb-5">
              <PlaylistIcon />
              <AccordionTrigger className="text-white text-[20px]">
                Плейлисты
              </AccordionTrigger>
            </div>
            <div className="flex flex-col items-start gap-3 max-[198px] truncate">
              {userPlaylist.map((playlist, index) => (
                <AccordionContent
                  key={index}
                  className="text-white text-[20px] flex gap-4 justify-start cursor-pointer "
                >
                  <Link href={`/playlist/${playlist.id}`}>{playlist.name}</Link>
                </AccordionContent>
              ))}
              <AccordionContent>
                <Link
                  href={`/collection/playlist`}
                  className="text-white text-[20px] flex gap-4 justify-start cursor-pointer hover:text-[#6300ff]"
                >
                  Все плейлисты
                </Link>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      <div
        onClick={handleLogout}
        className="flex gap-3 align-center pl-3 py-[12px] rounded-[14px] hover:bg-[#6300ff] cursor-pointer"
      >
        <ExitIcon />
        <span className="text-white text-[20px]">Выход</span>
      </div>
    </div>
  );
};

export default Sidebar;
