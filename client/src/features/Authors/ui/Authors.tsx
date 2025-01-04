"use client";

import React, { useEffect, useState } from "react";
import authorService from "@/entities/author-service";
import AuthorIcon from "../../../../public/assets/icons/Artist";
import { Skeleton } from "@/shared/components/ui/skeleton";

const Authors = () => {
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchAuthors = async (params = { count: 5, offset: 0 }) => {
    try {
      setLoading(true);
      const response = await authorService.getAll(params);
      setAuthors(response);
      console.log("authors", authors);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);
  return (
    <div className="bg-[#09090B] pb-[24px] mb-16 min-h-[284px]">
      <div className="mb-4 flex items-center max-w-[270px] justify-between">
        <span className="text-[16px] text-white">Авторы</span>
      </div>
      <div className="flex gap-[30px] flex-wrap">
        {loading
          ? Array(8)
              .fill(0)
              .map((_, index) => (
                <Skeleton key={index} className="w-[170px] h-[225px]" />
              ))
          : authors.map((author) => (
              <div
                key={author.id}
                className={`
         cursor-pointer flex flex-col grow justify-between max-w-[172px]  p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
         
       `}
              >
                <div className="rounded-[4px] flex justify-center items-center min-h-[170px]">
                  <AuthorIcon height="100" width="100" />
                </div>
                <div className="flex flex-col justify-center items-center gap-[2px] text-center">
                  <p className="text-white text-[14px]">{author.name}</p>
                </div>
              </div>
            ))}
        {/* {authors.map((author) => (
          <div
            key={author.id}
            className={`
         cursor-pointer flex flex-col grow justify-between max-w-[172px]  p-[12px] bg-[#5801E1] rounded-[12px] gap-[10px] hover:bg-[#7A1FE3] hover:brightness-110 transition-all duration-300 relative 
         
       `}
          >
            <div className="rounded-[4px] flex justify-center items-center min-h-[170px]">
              <AuthorIcon height="100" width="100" />
            </div>
            <div className="flex flex-col justify-center items-center gap-[2px] text-center">
              <p className="text-white text-[14px]">{author.name}</p>
            </div>
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default Authors;
