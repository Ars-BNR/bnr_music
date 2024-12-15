"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

import img1 from "../../../../public/assets/img/carousel1.jpg";
import img2 from "../../../../public/assets/img/carousel1.jpg";
import img3 from "../../../../public/assets/img/carousel1.jpg";
import img4 from "../../../../public/assets/img/carousel1.jpg";
import img5 from "../../../../public/assets/img/carousel1.jpg";
import img6 from "../../../../public/assets/img/carousel1.jpg";
import stl from "../styles/Carousel.module.scss";
const Carousel = () => {
  const images = [img1, img2, img3, img4, img5, img6];
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const move = (direction: "next" | "prev") => {
    let newIndex = currentIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % images.length;
    } else if (direction === "prev") {
      newIndex = (currentIndex - 1 + images.length) % images.length;
    }
    setCurrentIndex(newIndex);
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) {
      move("next");
    } else {
      move("prev");
    }
  };

  const handleClick = (direction: "next" | "prev") => {
    move(direction);
  };

  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener("wheel", handleWheel);
    }

    // Отключаем вертикальный скролл макета
    document.body.style.overflowY = "hidden";

    return () => {
      if (carouselElement) {
        carouselElement.addEventListener("wheel", handleWheel);
      }
      // Восстанавливаем вертикальный скролл макета
      document.body.style.overflowY = "auto";
    };
  }, [currentIndex]);

  return (
    <div
      className={`${stl.carousel} max-w-[803px] bg-slate-950 flex justify-center items-center grow w-full mx-auto mb-[50px]`}
      ref={carouselRef}
    >
      {images.map((img, index) => {
        let className = "";
        if (index === currentIndex) {
          className = stl.selected;
        } else if (
          index ===
          (currentIndex - 1 + images.length) % images.length
        ) {
          className = stl.prev;
        } else if (
          index ===
          (currentIndex - 2 + images.length) % images.length
        ) {
          className = stl.prevLeftSecond;
        } else if (index === (currentIndex + 1) % images.length) {
          className = stl.next;
        } else if (index === (currentIndex + 2) % images.length) {
          className = stl.nextRightSecond;
        } else {
          className = index < currentIndex ? stl.hideLeft : stl.hideRight;
        }

        return (
          <div key={index} className={`${stl.carouselItem} ${className}`}>
            <Image src={img} alt={`carousel-item-${index}`} />
          </div>
        );
      })}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <button onClick={() => handleClick("prev")}>Prev</button>
        <button onClick={() => handleClick("next")}>Next</button>
      </div>
    </div>
  );
};

export default Carousel;
