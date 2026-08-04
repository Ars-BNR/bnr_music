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
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import styles from "../styles/RegistrationForm.module.scss";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import AuthStore from "@/shared/store/auth";
import { Field, FieldGroup } from "@/shared/ui/field";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export const RegistrationForm = () => {
  const registration = AuthStore((state) => state.registration);
  const router = useRouter();
  const form = useForm<TFormRegisterValues>({
    resolver: zodResolver(formRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const onSubmit = async (data: TFormRegisterValues) => {
    try {
      await registration({ email: data.email, password: data.password, router });
    } catch {
      form.setError("root", { message: "Не удалось зарегистрировать аккаунт." });
    }
  };
  return (
    <div className={styles.RegForm}>
      <div className={styles.RegForm__block}>
        <div className={styles.RegForm__title}>Регистрация</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
            {form.formState.errors.root?.message && (
              <Alert variant="destructive">
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
            <FieldGroup>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.email}><FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem></Field>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.password}><FormItem>
                  <FormLabel className="text-white">Пароль</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Введите пароль"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem></Field>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <Field data-invalid={!!form.formState.errors.confirmPassword}><FormItem>
                  <FormLabel className="text-white">
                    Подтверждение пароля
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Введите пароль снова"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem></Field>
              )}
            /></FieldGroup>
            <div className={styles.Buttons}>
              <Button className="max-w-[204px]" type="submit">
                Зарегистрироваться
              </Button>
              <Button
                className="max-w-[204px]"
                type="button"
                onClick={() => router.replace("/login")}
              >
                Войти
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default RegistrationForm;
