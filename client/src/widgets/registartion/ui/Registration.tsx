import React from 'react'
import stl from "../styles/Registration.module.scss"
import RegistrationForm from '@/features/Registration/ui/RegistrationForm'
const Registration = () => {
  return (
    <div className={stl.background}>
        <h1 className="text-5xl bg-gradient-to-r from-[#9153cb] to-[#e1d6d2] bg-clip-text text-transparent">
        BNR - Be Natural Rare
      </h1>
      <RegistrationForm />
    </div>
  )
}

export default Registration