"use client";

import { formLoginSchema, TFormLoginValues } from "@/shared/constants/validateSchemas";
import AuthStore from "@/shared/store/auth";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup } from "@/shared/ui/field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";

const getLoginErrorMessage = (cause: unknown) => {
  if (!isAxiosError(cause)) {
    return "Не удалось выполнить вход. Попробуйте ещё раз.";
  }
  if (!cause.response) {
    return "Сервер недоступен. Проверьте подключение и попробуйте ещё раз.";
  }
  if (cause.response.status === 400) {
    return "Проверьте формат email и пароля.";
  }
  if (cause.response.status === 401) {
    return "Неверный email или пароль.";
  }
  if (cause.response.status === 429) {
    return "Слишком много попыток входа. Попробуйте немного позже.";
  }
  return "Сервис входа временно недоступен. Попробуйте ещё раз позже.";
};

const LoginForm = () => {
  const login = AuthStore((state) => state.login);
  const loading = AuthStore((state) => state.isLoading);
  const router = useRouter();
  const form = useForm<TFormLoginValues>({ resolver: zodResolver(formLoginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = async (data: TFormLoginValues) => {
    try {
      await login({ email: data.email, password: data.password, router });
    } catch (cause) {
      form.setError("root", { message: getLoginErrorMessage(cause) });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {form.formState.errors.root?.message ? <Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert> : null}
        <FieldGroup className="gap-5">
          <FormField control={form.control} name="email" render={({ field }) => (
            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Email</FormLabel><FormControl><Input variant="auth" type="email" autoComplete="email" placeholder="name@example.com" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem>
            </Field>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Пароль</FormLabel><FormControl><Input variant="auth" type="password" autoComplete="current-password" placeholder="Введите пароль" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem>
            </Field>
          )} />
        </FieldGroup>
        <Button variant="brand" size="auth" type="submit" disabled={loading} className="w-full">
          {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null} Войти
        </Button>
        <p className="text-center text-sm text-bnr-ash">Нет аккаунта? {loading ? <span>Создайте его после завершения входа.</span> : <Link href="/registration" className="font-medium text-bnr-lilac underline-offset-4 hover:underline">Зарегистрироваться</Link>}</p>
      </form>
    </Form>
  );
};

export default LoginForm;
