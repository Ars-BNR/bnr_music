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
import drill from "../../../../public/assets/img/image 3.png";
import Image from "next/image";
import ExitIcon from "../../../../public/assets/icons/Exit";
export const Sidebar = () => {
  const router = useRouter();
  return (
    <div className={stl.sidebar}>
      <Title className="text-[20px] mb-6">BNR - Be Natural Rare</Title>
      <div className={stl.links__list}>
        <Link href={"/"} className={stl.sidebar__el}>
          <HomeIcon />
          <span className="text-[20px]">Главная</span>
        </Link>

        <Link href={"/"} className={stl.sidebar__el}>
          <CategoryIcon />
          <span className="text-[20px]">Категории</span>
        </Link>

        <Link href={"/"} className={stl.sidebar__el}>
          <ArtistIcon />
          <span className="text-[20px]">Артисты</span>
        </Link>

        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <div className="flex items-center gap-3  mb-5">
              <PlaylistIcon />
              <AccordionTrigger className="text-white text-[20px]">
                Плейлисты
              </AccordionTrigger>
            </div>
            <div className="flex flex-col items-center gap-5">
              <AccordionContent className="text-white text-[20px] flex gap-4 justify-center">
                <Image src={drill} alt="" />
                Drill
              </AccordionContent>
              <AccordionContent className="text-white text-[20px] flex gap-4 justify-center">
                <Image src={drill} alt="" />
                Drill
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex gap-3 align-center pl-3 py-[12px] rounded-[14px] hover:bg-[#6300ff]">
        <ExitIcon />
        <span className="text-white text-[20px] ">Выход</span>
      </div>
    </div>
  );
};

export default Sidebar;
