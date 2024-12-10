"use client";

import {
  formRegisterSchema,
  TFormRegisterValues,
} from "@/shared/constants/validateSchemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import styles from "../styles/RegistrationForm.module.scss";
import { Button } from "@/shared/components/ui/button";
import { useRouter } from "next/navigation";

export const  RegistrationForm = () => {
  const router = useRouter();
  const form = useForm<TFormRegisterValues>({
    resolver: zodResolver(formRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword:"",
    },
  });
  const onSubmit = (data: TFormRegisterValues) => {
    console.log(data, "data");
  };
  return (
    <div className={styles.RegForm}>
      <div className={styles.RegForm__block}>
        <div className={styles.RegForm__title}>Регистрация</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Пароль</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Введите пароль"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Подтверждение пароля</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Введите пароль снова"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className={styles.Buttons}>
              <Button  className="max-w-[204px]" type="submit">Зарегистрироваться</Button>
              <Button   className="max-w-[204px]" type="button" onClick={()=>router.replace("/login")} >Войти</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegistrationForm;
