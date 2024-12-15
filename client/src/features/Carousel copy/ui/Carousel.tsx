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
const CarouselWidget = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardSliderRef = useRef(null);
  const images = [
    "https://via.placeholder.com/800x500?text=Image+1",
    "https://via.placeholder.com/800x500?text=Image+2",
    "https://via.placeholder.com/800x500?text=Image+3",
    "https://via.placeholder.com/800x500?text=Image+4",
  ];
  const handleMouseMove = (event) => {
    const slider = cardSliderRef.current;
    if (slider) {
      const sliderRect = slider.getBoundingClientRect();
      console.log(sliderRect);
      const offsetX = event.clientX - sliderRect.left;
      const percentage = offsetX / sliderRect.width;
      const newIndex = Math.floor(percentage * images.length);
      setCurrentIndex(Math.min(Math.max(newIndex, 0), images.length - 1));
    }
  };

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

export default CarouselWidget;
