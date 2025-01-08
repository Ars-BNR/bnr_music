import React, { useEffect, useRef, useState } from "react";

interface CardItemProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: (e: any) => void;
  className?: string;
}

const CardItem = ({
  imageUrl,
  title,
  subtitle,
  icon,
  active = false,
  onClick,
  className = "",
}: CardItemProps) => {
  const titleRef = useRef<HTMLParagraphElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [isSubtitleOverflowing, setIsSubtitleOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = (element: HTMLElement | null) => {
      if (element) {
        return element.scrollWidth > element.clientWidth;
      }
      return false;
    };

    setIsTitleOverflowing(checkOverflow(titleRef.current));
    setIsSubtitleOverflowing(checkOverflow(subtitleRef.current));
  }, [title, subtitle]);

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer flex flex-col grow justify-between max-w-[172px] p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
        ${active ? "bg-red-900" : ""}
        ${className}
      `}
    >
      <div className="rounded-[4px] flex justify-center items-center min-h-[170px]">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="rounded-[4px]" />
        ) : (
          icon
        )}
      </div>
      <div className="flex flex-col justify-center items-center gap-[2px] text-center w-full overflow-hidden">
        <div className="w-full overflow-hidden">
          <p
            ref={titleRef}
            className={`text-white text-[14px] whitespace-nowrap ${
              isTitleOverflowing ? "animate-scroll" : "truncate"
            }`}
            style={{
              animationDuration: "12s",
            }}
          >
            {title}
          </p>
        </div>

        {subtitle && (
          <div className="w-full overflow-hidden">
            <p
              ref={subtitleRef}
              className={`text-[#B6A295] text-[12px] mb-[4px] whitespace-nowrap ${
                isSubtitleOverflowing ? "animate-scroll" : "truncate"
              }`}
              style={{
                animationDuration: "12s",
              }}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardItem;
