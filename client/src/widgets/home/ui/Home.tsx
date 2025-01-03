"use client";

import Category from "@/features/Category/ui/Category";
import PopularSongs from "@/features/PopularSongs/ui/PopularSongs";
import Carousel from "@/features/TruthCarousel/ui/Carousel";
import React from "react";

const Home = () => {
  return (
    <>
      <Carousel />

      <Category />

      <PopularSongs />
    </>
  );
};

export default Home;
