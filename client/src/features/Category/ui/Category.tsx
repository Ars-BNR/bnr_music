import { badgeVariants } from '@/shared/components/ui/badge'
import Link from 'next/link'
import React from 'react'
import ArrowIcon from '../../../../public/assets/icons/Arrow'
const Category = () => {
  return (
    <div className='bg-[#09090B] mb-[70px]'>
        <div className="mb-4 flex items-center gap-[42px]">
            <span className='text-[16px] text-white'>Выберите категорию</span>
            <div className="flex gap-[24px]">
            <ArrowIcon/>
            <ArrowIcon reverse={true} />
            </div>
        </div>
        <div className="flex gap-[24px]">
        <Link href={"/"} className={badgeVariants({ variant: "default" })}>Все</Link>
        <Link href={"/"} className={badgeVariants({ variant: "default" })}>Sad</Link>
        <Link href={"/"} className={badgeVariants({ variant: "default" })}>Party</Link>
        <Link href={"/"} className={badgeVariants({ variant: "default" })}>Фонк</Link>

        </div>
    </div>
  )
}

export default Category