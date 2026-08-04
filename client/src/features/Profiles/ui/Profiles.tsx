"use client";

import React, { useCallback, useEffect, useState } from "react";
import ArtistIcon from "../../../../public/assets/icons/Artist";
import LoveIcon from "../../../../public/assets/icons/Love";
import SettingsIcon from "../../../../public/assets/icons/Settings";
import Link from "next/link";
import AuthStore from "@/shared/store/auth";
import collectionService from "@/entities/collection-service";

const Profiles = () => {
  const userId = AuthStore((state) => state.profiles?.user.sub);
  const [collectionId, setCollectionId] = useState<number | null>(null);

  const fetchCollectionId = useCallback(async () => {
    if (!userId) return;

    const savedCollectionId =
      collectionService.getCollectionIdFromLocalStorage();
    if (savedCollectionId) {
      setCollectionId(savedCollectionId);
      return;
    }

    try {
      if (userId !== null) {
        const response = await collectionService.getCollectionIdByUserId(
          userId
        );
        const newCollectionId = response.id; // Предполагаем, что ответ содержит поле `id`
        setCollectionId(newCollectionId);
        collectionService.saveCollectionIdToLocalStorage(newCollectionId);
      }
    } catch {}
  }, [userId]);
  useEffect(() => {
    void fetchCollectionId();
  }, [fetchCollectionId]);

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
