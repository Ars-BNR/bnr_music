"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import Album from "../../../../public/assets/icons/Album";
import PlaylistIcon from "../../../../public/assets/icons/Playlist";
import LoveIcon from "../../../../public/assets/icons/Love";

const Collection = () => {
  const params = useParams();
  const router = useRouter();

  return (
    <div className="bg-[#09090B] pb-[24px] mb-16 min-h-[284px] text-yellow-50 flex justify-between">
      <CardItem
        className="max-w-[30%]"
        title="Альбомы"
        icon={<Album height="100" width="100" />}
        onClick={() => router.push("/collection/albums")}
      />
      <CardItem
        className="max-w-[30%]"
        title="Плейлисты"
        icon={<PlaylistIcon height="100" width="100" />}
        onClick={() => router.push("/collection/playlist")}
      />
      <CardItem
        className="max-w-[30%]"
        title="Любимые треки"
        icon={<LoveIcon height="100" width="100" />}
        onClick={() => router.push("/collection/tracks")}
      />
    </div>
  );
};

export default Collection;
