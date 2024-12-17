"use client";

import React from "react";
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
export const Sidebar = () => {
  const router = useRouter();
  const links = [
    { href: "/", icon: <HomeIcon />, text: "Главная" },
    { href: "/category", icon: <CategoryIcon />, text: "Категории" },
    { href: "/author", icon: <ArtistIcon />, text: "Артисты" },
  ];
  const playlist = [
    {  name: "Drill" },
    {  name: "Hip-hop" },
    {  name: "Фонкус" },
    {  name: "Disturbed Best In the world sdwsasdasdasdasd" },
  ];
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
              {playlist.map((playlist, index) => (
                <AccordionContent
                  key={index}
                  className="text-white text-[20px] flex gap-4 justify-start cursor-pointer "
                >
                  {playlist.name}
                </AccordionContent>
              ))}
              <AccordionContent>
              <Link href={"/"} className="text-white text-[20px] flex gap-4 justify-start cursor-pointer hover:text-[#6300ff]" >Все плейлисты</Link>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex gap-3 align-center pl-3 py-[12px] rounded-[14px] hover:bg-[#6300ff] cursor-pointer">
        <ExitIcon />
        <span className="text-white text-[20px]">Выход</span>
      </div>
    </div>
  );
};

export default Sidebar;
