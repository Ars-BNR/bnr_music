import React from "react";
import stl from "../styles/Registration.module.scss";
import RegistrationForm from "@/features/Registration/ui/RegistrationForm";
import Title from "@/shared/components/common/Title/Title";
const Registration = () => {
  return (
    <div className={stl.background}>
      <Title className="text-5xl absolute top-[54px] left-[120px]">BNR - Be Natural Rare</Title>
      <RegistrationForm />
    </div>
  );
};

export default Registration;
