"use client";

import React from "react";
import CardItem from "@/shared/components/common/CardItem/CardItem";
import Album from "../../../../public/assets/icons/Album";
import PlaylistIcon from "../../../../public/assets/icons/Playlist";
import LoveIcon from "../../../../public/assets/icons/Love";

const Collection = () => {
  return (
    <div className="mb-16 grid min-h-[284px] grid-cols-1 gap-4 text-bnr-bone sm:grid-cols-3">
      <CardItem
        className="min-h-[180px]"
        title="Альбомы"
        icon={<Album height="100" width="100" />}
        href="/collection/albums"
      />
      <CardItem
        className="min-h-[180px]"
        title="Плейлисты"
        icon={<PlaylistIcon height="100" width="100" />}
        href="/collection/playlist"
      />
      <CardItem
        className="min-h-[180px]"
        title="Любимые треки"
        icon={<LoveIcon height="100" width="100" />}
        href="/collection/tracks"
      />
    </div>
  );
};

export default Collection;
