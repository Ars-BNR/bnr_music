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
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import styles from "../styles/LoginForm.module.scss";
import { Button } from "@/shared/ui/button";
import { useRouter } from "next/navigation";
import AuthStore from "@/shared/store/auth";
import { LoaderCircle } from "lucide-react";
import { Field, FieldGroup } from "@/shared/ui/field";
import { Alert, AlertDescription } from "@/shared/ui/alert";

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
      await login({ email: data.email, password: data.password, router });
    } catch {
      form.setError("root", { message: "Не удалось выполнить вход. Проверьте данные." });
    }
  };

  return (
    <div className={styles.LoginForm}>
      <div className={styles.LoginForm__block}>
        <div className={styles.LoginForm__title}>Вход</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
            {form.formState.errors.root?.message && (
              <Alert variant="destructive">
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}
            <FieldGroup><FormField
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
            /></FieldGroup>
            <div className={styles.Buttons}>
              <Button disabled={loading} className="max-w-[204px]" type="submit">
                {loading && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
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
