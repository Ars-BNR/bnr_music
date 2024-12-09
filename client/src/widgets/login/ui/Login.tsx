import LoginForm from '@/features/Form/ui/LoginForm'
import React from 'react'
import stl from "../styles/Login.module.scss"
const Login = () => {
  return (
    <div className={stl.background}>
        <h1 className="text-5xl bg-gradient-to-r from-[#9153cb] to-[#e1d6d2] bg-clip-text text-transparent">
        BNR - Be Natural Rare
      </h1>
      <LoginForm />
    </div>
  )
}

export default Login