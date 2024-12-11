import React from "react";
import ArtistIcon from "../../../../public/assets/icons/Artist";
import LoveIcon from "../../../../public/assets/icons/Love";
import SettingsIcon from "../../../../public/assets/icons/Settings";

const Profiles = () => {
  return <div className="flex px-8 py-4 gap-[32px] bg-[#23262D] rounded-[12px]">
    <ArtistIcon/>
    <LoveIcon/>
    <SettingsIcon/>
  </div>;
};

export default Profiles;
