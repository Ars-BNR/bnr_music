"use client"

import React, { useState } from "react";
import stl from "../styles/Carousel.module.scss";
import img1 from "../../../../public/assets/img/carousel1.jpg";
import img2 from "../../../../public/assets/img/carousel1.jpg";
import img3 from "../../../../public/assets/img/carousel1.jpg";
import img4 from "../../../../public/assets/img/carousel1.jpg";
import img5 from "../../../../public/assets/img/carousel1.jpg";
import Image from "next/image";
import PlayIcon from "../../../../public/assets/icons/Play";

const images = [
  { src: img1, name: "Assassin’s Creed II", author: "Jesper Kyd" },
  { src: img2, name: "Far Cry 3", author: "Brian Tyler" },
  { src: img3, name: "The Witcher 3", author: "Marcin Przybyłowicz" },
  { src: img4, name: "Red Dead Redemption", author: "Bill Elm & Woody Jackson" },
  { src: img5, name: "Uncharted 4", author: "Henry Jackman" },
];

const Carousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClick = (index:any) => {
    setActiveIndex(index);
  };

  return (
    <div className={stl.Carousel}>
      {images.map((image, index) => {
        const isCenter = index === activeIndex;
        const isLeft = index < activeIndex;
        const isRight = index > activeIndex;

        let positionClass = stl.Carousel__block;
        let zIndex = 1;
        let scale = 1;
        let left = 0;

        if (isLeft) {
          if (index === activeIndex - 1) {
            positionClass = stl.Carousel__blockLeft;
            zIndex = 1;
            scale = 0.88;
            left = 151;
          } else {
            positionClass = stl.Carousel__blockLeft__left;
            zIndex = 0;
            scale = 0.7;
            left = 25;
          }
        } else if (isRight) {
          if (index === activeIndex + 1) {
            positionClass = stl.Carousel__blockRight;
            zIndex = 1;
            scale = 0.88;
            left = 399;
          } else {
            positionClass = stl.Carousel__blockRight__right;
            zIndex = 0;
            scale = 0.7;
            left = 508;
          }
        } else {
          zIndex = 2;
        }

        return (
          <div
            key={index}
            className={`${stl.Carousel__block} ${positionClass}`}
            style={{
              position: "absolute",
              zIndex,
              transform: `scale(${scale})`,
              left: `${left}px`,
              transition: "transform 0.5s ease, left 0.5s ease, z-index 0.5s ease",
            }}
            onClick={() => handleClick(index)}
          >
            <div className={stl.Carousel__img}>
              <Image className={stl.image} src={image.src} alt="img" />
            </div>
            {isCenter && (
              <div className={stl.Carousel__info}>
                <div className={stl.Carousel__text}>
                  <p className={stl.text__name}>{image.name}</p>
                  <p className={stl.text__author}>{image.author}</p>
                </div>
                <div className={stl.play}>
                  <PlayIcon />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Carousel;