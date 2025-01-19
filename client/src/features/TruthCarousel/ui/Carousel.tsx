"use client";

import React, { useState, useEffect } from "react";
import stl from "../styles/Carousel.module.scss";
import img1 from "../../../../public/assets/img/carousel1.jpg";
import img2 from "../../../../public/assets/img/ac3.png";
import img3 from "../../../../public/assets/img/ac4.png";
import img4 from "../../../../public/assets/img/saints3.png";
import img5 from "../../../../public/assets/img/saints4.png";
import Image from "next/image";
import PlayIcon from "../../../../public/assets/icons/Play";
import Link from "next/link";
import useAlbumStore from "@/shared/store/album";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BASE_URL } from "@/shared/config/config";

const images = [img1, img2, img3, img4, img5];

const imageTexts = [
  "Beautiful landscape",
  "City at night",
  "Sunset over the mountains",
  "Beach paradise",
  "Abstract art",
];

const authors = [
  "John Doe",
  "Jane Smith",
  "Mike Johnson",
  "Emily Brown",
  "Alex Wilson",
];

const Carousel = () => {
  const { albums, fetchTopAlbums, loading } = useAlbumStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleImageClick = (index: number) => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsExiting(true);
      setNextIndex(index);

      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsExiting(false);

        setTimeout(() => {
          setIsAnimating(false);
        }, 500);
      }, 500);
    }
  };

  const getShiftedIndex = (shift: number) => {
    const newIndex = (currentIndex + shift + images.length) % images.length;
    return newIndex;
  };

  useEffect(() => {
    fetchTopAlbums();
  }, [fetchTopAlbums]);

  const currentAlbum = albums[currentIndex];
  const nextAlbum = albums[nextIndex];

  if (loading || !albums || albums.length === 0) {
    return (
      <Skeleton
        className={stl.Carousel}
        style={{ height: "338px", width: "100%" }}
      />
    );
  }

  if (albums !== null) {
    return (
      <div className={stl.Carousel}>
        <Link
          href={`/album/${albums[currentIndex].id}`}
          className={stl.Carousel__block}
          onClick={() => handleImageClick(getShiftedIndex(0))}
        >
          <div className={stl.Carousel__img}>
            <img
              className={`${stl.image} ${isExiting ? stl.imageExit : ""}`}
              src={`${BASE_URL}${
                isExiting ? currentAlbum.picture : nextAlbum.picture
              }`}
              alt={isExiting ? currentAlbum.name : nextAlbum.name}
            />
          </div>
          <div className={stl.Carousel__info}>
            <div className={stl.Carousel__text}>
              <p className={stl.text__name}>
                {isExiting ? albums[currentIndex].name : albums[nextIndex].name}
              </p>
              <p className={stl.text__author}>
                {isExiting
                  ? albums[currentIndex].authorName
                  : albums[nextIndex].authorName}
              </p>
            </div>
            <div className={stl.play}>
              <PlayIcon />
            </div>
          </div>
        </Link>

        <div
          className={stl.Carousel__blockLeft}
          onClick={() => handleImageClick(getShiftedIndex(-1))}
        >
          <div className={stl.Carousel__img}>
            <Image
              className={stl.image}
              src={images[getShiftedIndex(-1)]}
              alt="img"
            />
          </div>
        </div>

        <div
          className={stl.Carousel__blockLeft__left}
          onClick={() => handleImageClick(getShiftedIndex(-2))}
        >
          <div className={stl.Carousel__img}>
            <Image
              className={stl.image}
              src={images[getShiftedIndex(-2)]}
              alt="img"
            />
          </div>
        </div>

        <div
          className={stl.Carousel__blockRight}
          onClick={() => handleImageClick(getShiftedIndex(1))}
        >
          <div className={stl.Carousel__img}>
            <Image
              className={stl.image}
              src={images[getShiftedIndex(1)]}
              alt="img"
            />
          </div>
        </div>

        <div
          className={stl.Carousel__blockRight__right}
          onClick={() => handleImageClick(getShiftedIndex(2))}
        >
          <div className={stl.Carousel__img}>
            <Image
              className={stl.image}
              src={images[getShiftedIndex(2)]}
              alt="img"
            />
          </div>
        </div>
      </div>
    );
  }
};

export default Carousel;
