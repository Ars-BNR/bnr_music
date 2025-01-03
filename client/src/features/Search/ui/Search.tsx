"use client";

import trackService from "@/entities/track-service";
import { Input } from "@/shared/components/ui/input";
import { debounce } from "@/shared/constants/debounce";
import usePlayerStore from "@/shared/store/player";
import React, { useCallback, useEffect, useRef, useState } from "react";

const Search = () => {
  const { playTrack, setActiveTrack } = usePlayerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [focused, setFocused] = React.useState(false);

  const ref = useRef<HTMLDivElement>(null);

  // Обработка кликов вне области поиска
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };

    // Добавляем обработчик при монтировании
    document.addEventListener("mousedown", handleClickOutside);

    // Удаляем обработчик при размонтировании
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchData = async (query: string) => {
    if (query) {
      try {
        console.log("Отправка запроса с запросом:", query);
        const resultQuery = await trackService.searchTracks(query);
        setData(resultQuery);
      } catch (error) {
        console.log(error);
      }
    } else {
      setData([]);
    }
  };
  useEffect(() => {
    console.log("Данные, полученные от API:", data);
  }, [data]);

  // Создаем debounced версию функции поиска
  const debouncedSearchTracks = useCallback(
    debounce((query: string) => searchData(query), 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearchTracks(query); // Вызываем debounced функцию
  };
  const play = (e: React.MouseEvent, track) => {
    e.stopPropagation();
    setActiveTrack(track);
    playTrack();
    console.log("track_of_Search", track);
  };

  return (
    <>
      {focused && (
        <div className="fixed top-0 left-0 bottom-0 right-0 bg-black/50 z-30" />
      )}
      <div
        ref={ref}
        style={{
          width: "100%",
        }}
        className="relative max-w-[486px] z-40"
      >
        {/* Поле ввода для поиска */}
        <Input
          className="max-w-[486px]"
          placeholder="Search song"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
        />
        {/* Отображение результатов поиска */}
        {data.length > 0 && (
          <div className="absolute w-full bg-white rounded-md shadow-lg mt-1 z-50">
            {data.map((track) => (
              <div
                key={track.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={(e) => play(e, track)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-gray-500">
                      {track.author?.name} • {track.album?.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Search;
