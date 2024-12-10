import LoginForm from "@/features/Form/ui/LoginForm";
import React from "react";
import stl from "../styles/Login.module.scss";
import Title from "@/shared/components/common/Title/Title";
const Login = () => {
  return (
    <div className={stl.background}>
      <Title className="text-5xl absolute top-[54px] left-[120px]">BNR - Be Natural Rare</Title>
      <LoginForm />
    </div>
  );
};

export default Login;
