"use client";

import {
  formLoginSchema,
  TFormLoginValues,
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
import React, { FormEvent } from "react";
import { useForm } from "react-hook-form";
import styles from "../styles/LoginForm.module.scss";
import { Button } from "@/shared/components/ui/button";
import { useRouter } from "next/navigation";
import AuthStore from "@/shared/store/auth";

const LoginForm = () => {
  const login = AuthStore((state) => state.login);
  const loading = AuthStore((state) => state.isLoading);
  const router = useRouter();
  const form = useForm<TFormLoginValues>({
    resolver: zodResolver(formLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: TFormLoginValues) => {
    try {
      login({ email: data.email, password: data.password, router });
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
      }
    }
  };

  return (
    <div className={styles.LoginForm}>
      <div className={styles.LoginForm__block}>
        <div className={styles.LoginForm__title}>Вход</div>
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
            <div className={styles.Buttons}>
              <Button loading={loading} className="max-w-[204px]" type="submit">
                Войти
              </Button>
              <Button
                className="max-w-[204px]"
                type="button"
                onClick={() => router.replace("/registration")}
              >
                Зарегистрироваться
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LoginForm;
