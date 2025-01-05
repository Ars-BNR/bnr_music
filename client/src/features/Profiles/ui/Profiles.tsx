"use client";

import React, { useEffect, useState } from "react";
import ArtistIcon from "../../../../public/assets/icons/Artist";
import LoveIcon from "../../../../public/assets/icons/Love";
import SettingsIcon from "../../../../public/assets/icons/Settings";
import Link from "next/link";
import AuthStore from "@/shared/store/auth";
import $api from "@/entities/http-service";

const Profiles = () => {
  const userId = AuthStore((state) => state.profiles.user.id);
  const [collectionId, setCollectionId] = useState<number | null>(null);

  // Получаем id коллекции по id пользователя
  useEffect(() => {
    const fetchCollectionId = async () => {
      try {
        const response = await $api.get(`/collection/user/${userId}`);
        setCollectionId(response.data.id); // Предполагаем, что ответ содержит поле `id`
      } catch (error) {
        console.error("Ошибка при получении id коллекции:", error);
      }
    };

    if (userId) {
      fetchCollectionId();
    }
  }, [userId]);

  return (
    <div className="flex px-8 py-4 gap-[32px] bg-[#23262D] rounded-[12px]">
      <ArtistIcon />
      <Link href={`/collection/${collectionId}`}>
        <LoveIcon />
      </Link>
      <SettingsIcon />
    </div>
  );
};

export default Profiles;
