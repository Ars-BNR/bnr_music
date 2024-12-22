// "use client";

// import React, { useState } from "react";
// import stl from "../styles/Carousel.module.scss";
// import img1 from "../../../../public/assets/img/carousel1.jpg";
// import img2 from "../../../../public/assets/img/carousel1.jpg";
// import img3 from "../../../../public/assets/img/carousel1.jpg";
// import img4 from "../../../../public/assets/img/carousel1.jpg";
// import img5 from "../../../../public/assets/img/carousel1.jpg";
// import Image from "next/image";
// import PlayIcon from "../../../../public/assets/icons/Play";
// const images = [img1, img2, img3, img4, img5];
// const Carousel = () => {
//   return (
//     <div className={stl.Carousel}>
//       <div className={stl.Carousel__block}>
//         <div className={stl.Carousel__img}>
//           <Image className={stl.image} src={img1} alt="img" />
//         </div>
//         <div className={stl.Carousel__info}>
//           <div className={stl.Carousel__text}>
//             <p className={stl.text__name}>Assassin’s Creed II</p>
//             <p className={stl.text__author}>Jesper Kyd</p>
//           </div>
//           <div className={stl.play}>
//             <PlayIcon />
//           </div>
//         </div>
//       </div>
//       <div className={stl.Carousel__blockLeft}>
//         <div className={stl.Carousel__img}>
//           <Image className={stl.image} src={img1} alt="img" />
//         </div>
//         <div className={stl.Carousel__info}>
//           <div className={stl.Carousel__text}>
//             <p className={stl.text__name}>Assassin’s Creed II</p>
//             <p className={stl.text__author}>Jesper Kyd</p>
//           </div>
//           <div className={stl.play}>
//             <PlayIcon />
//           </div>
//         </div>
//       </div>
//       <div className={stl.Carousel__blockLeft__left}>
//         <div className={stl.Carousel__img}>
//           <Image className={stl.image} src={img1} alt="img" />
//         </div>
//         <div className={stl.Carousel__info}>
//           <div className={stl.Carousel__text}>
//             <p className={stl.text__name}>Assassin’s Creed II</p>
//             <p className={stl.text__author}>Jesper Kyd</p>
//           </div>
//           <div className={stl.play}>
//             <PlayIcon />
//           </div>
//         </div>
//       </div>
//       <div className={stl.Carousel__blockRight}>
//         <div className={stl.Carousel__img}>
//           <Image className={stl.image} src={img1} alt="img" />
//         </div>
//         <div className={stl.Carousel__info}>
//           <div className={stl.Carousel__text}>
//             <p className={stl.text__name}>Assassin’s Creed II</p>
//             <p className={stl.text__author}>Jesper Kyd</p>
//           </div>
//           <div className={stl.play}>
//             <PlayIcon />
//           </div>
//         </div>
//       </div>
//       <div className={stl.Carousel__blockRight__right}>
//         <div className={stl.Carousel__img}>
//           <Image className={stl.image} src={img1} alt="img" />
//         </div>
//         <div className={stl.Carousel__info}>
//           <div className={stl.Carousel__text}>
//             <p className={stl.text__name}>Assassin’s Creed II</p>
//             <p className={stl.text__author}>Jesper Kyd</p>
//           </div>
//           <div className={stl.play}>
//             <PlayIcon />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Carousel;

// "use client";

// import React, { useState } from "react";
// import stl from "../styles/Carousel.module.scss";
// import img1 from "../../../../public/assets/img/carousel1.jpg";
// import img2 from "../../../../public/assets/img/ac3.png";
// import img3 from "../../../../public/assets/img/ac4.png";
// import img4 from "../../../../public/assets/img/saints3.png";
// import img5 from "../../../../public/assets/img/saints4.png";
// import Image from "next/image";
// import PlayIcon from "../../../../public/assets/icons/Play";
// const images = [img1, img2, img3, img4, img5];
// // Массив с текстами для каждого изображения
// const imageTexts = [
//   "Beautiful landscape",
//   "City at night",
//   "Sunset over the mountains",
//   "Beach paradise",
//   "Abstract art"
// ];

// // Массив с именами авторов для каждого изображения
// const authors = [
//   "John Doe",
//   "Jane Smith",
//   "Mike Johnson",
//   "Emily Brown",
//   "Alex Wilson"
// ];

// const Carousel = () => {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // Функция для смены центрального изображения при клике
//   const handleImageClick = (index: number) => {
//     setCurrentIndex(index);
//   };

//   // Функция для получения сдвинутого индекса с учетом текущего центра
//   const getShiftedIndex = (shift: number) => {
//     const newIndex = (currentIndex + shift + images.length) % images.length;
//     return newIndex;
//   };

//   return (
//     <div className={stl.Carousel}>
//       {/* Центральный блок */}
//       <div
//         className={stl.Carousel__block}
//         onClick={() => handleImageClick(getShiftedIndex(0))}
//       >
//         <div className={stl.Carousel__img}>
//           <Image
//             className={stl.image}
//             src={images[getShiftedIndex(0)]}
//             alt="img"
//           />
//         </div>
//         <div className={stl.Carousel__info}>
//           <div className={stl.Carousel__text}>
//             <p className={stl.text__name}>{imageTexts[getShiftedIndex(0)]}</p>
//             <p className={stl.text__author}>{authors[getShiftedIndex(0)]}</p>
//           </div>
//           <div className={stl.play}>
//             <PlayIcon />
//           </div>
//         </div>
//       </div>

//       {/* Левый блок */}
//       <div
//         className={stl.Carousel__blockLeft}
//         onClick={() => handleImageClick(getShiftedIndex(-1))}
//       >
//         <div className={stl.Carousel__img}>
//           <Image
//             className={stl.image}
//             src={images[getShiftedIndex(-1)]}
//             alt="img"
//           />
//         </div>
//       </div>

//       {/* Самый левый блок */}
//       <div
//         className={stl.Carousel__blockLeft__left}
//         onClick={() => handleImageClick(getShiftedIndex(-2))}
//       >
//         <div className={stl.Carousel__img}>
//           <Image
//             className={stl.image}
//             src={images[getShiftedIndex(-2)]}
//             alt="img"
//           />
//         </div>
//       </div>

//       {/* Правый блок */}
//       <div
//         className={stl.Carousel__blockRight}
//         onClick={() => handleImageClick(getShiftedIndex(1))}
//       >
//         <div className={stl.Carousel__img}>
//           <Image
//             className={stl.image}
//             src={images[getShiftedIndex(1)]}
//             alt="img"
//           />
//         </div>
//       </div>

//       {/* Самый правый блок */}
//       <div
//         className={stl.Carousel__blockRight__right}
//         onClick={() => handleImageClick(getShiftedIndex(2))}
//       >
//         <div className={stl.Carousel__img}>
//           <Image
//             className={stl.image}
//             src={images[getShiftedIndex(2)]}
//             alt="img"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Carousel;

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
import albumService from "@/entities/album-service";

const images = [img1, img2, img3, img4, img5];

// Массив с текстами для каждого изображения
const imageTexts = [
  "Beautiful landscape",
  "City at night",
  "Sunset over the mountains",
  "Beach paradise",
  "Abstract art",
];

// Массив с именами авторов для каждого изображения
const authors = [
  "John Doe",
  "Jane Smith",
  "Mike Johnson",
  "Emily Brown",
  "Alex Wilson",
];

const Carousel = () => {
  const [data, setData] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Функция для смены центрального изображения при клике
  const handleImageClick = (index: number) => {
    if (!isAnimating) {
      setIsAnimating(true); // Запускаем анимацию
      setIsExiting(true); // Запускаем фазу исчезновения
      setNextIndex(index); // Сохраняем индекс нового изображения

      // После завершения исчезновения (500 мс)
      setTimeout(() => {
        setCurrentIndex(nextIndex); // Обновляем текущий индекс
        setIsExiting(false); // Завершаем фазу исчезновения

        // После завершения появления (500 мс)
        setTimeout(() => {
          setIsAnimating(false); // Завершаем анимацию
        }, 500);
      }, 500);
    }
  };

  // Функция для получения сдвинутого индекса с учетом текущего центра
  const getShiftedIndex = (shift: number) => {
    const newIndex = (currentIndex + shift + images.length) % images.length;
    return newIndex;
  };

  const fetchAlbums = async (params = { count: 5, offset: 0 }) => {
    const response = await albumService.getTopAlbums(params);
    setData(response);
    console.log("data", data);
  };

  useEffect(() => {
    fetchAlbums();
  }, []);
  return (
    <div className={stl.Carousel}>
      {/* Центральный блок */}
      <div
        className={stl.Carousel__block}
        onClick={() => handleImageClick(getShiftedIndex(0))}
      >
        <div className={stl.Carousel__img}>
          <Image
            className={`${stl.image} ${isExiting ? stl.imageExit : ""}`}
            src={isExiting ? images[currentIndex] : images[nextIndex]}
            alt="img"
          />
        </div>
        <div className={stl.Carousel__info}>
          <div className={stl.Carousel__text}>
            <p className={stl.text__name}>
              {isExiting ? imageTexts[currentIndex] : imageTexts[nextIndex]}
            </p>
            <p className={stl.text__author}>
              {isExiting ? authors[currentIndex] : authors[nextIndex]}
            </p>
          </div>
          <div className={stl.play}>
            <PlayIcon />
          </div>
        </div>
      </div>

      {/* Левый блок */}
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

      {/* Самый левый блок */}
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

      {/* Правый блок */}
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

      {/* Самый правый блок */}
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
};

export default Carousel;
