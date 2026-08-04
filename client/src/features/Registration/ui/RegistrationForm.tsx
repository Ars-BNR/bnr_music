"use client";

import { formRegisterSchema, TFormRegisterValues } from "@/shared/constants/validateSchemas";
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

export const RegistrationForm = () => {
  const registration = AuthStore((state) => state.registration);
  const loading = AuthStore((state) => state.isLoading);
  const router = useRouter();
  const form = useForm<TFormRegisterValues>({ resolver: zodResolver(formRegisterSchema), defaultValues: { email: "", password: "", confirmPassword: "" } });

  const onSubmit = async (data: TFormRegisterValues) => {
    try {
      await registration({ email: data.email, password: data.password, router });
    } catch {
      form.setError("root", { message: "Не удалось зарегистрировать аккаунт. Попробуйте ещё раз." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {form.formState.errors.root?.message ? <Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert> : null}
        <FieldGroup className="gap-5">
          <FormField control={form.control} name="email" render={({ field }) => (<Field data-invalid={Boolean(form.formState.errors.email)}><FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Email</FormLabel><FormControl><Input variant="auth" type="email" autoComplete="email" placeholder="name@example.com" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem></Field>)} />
          <FormField control={form.control} name="password" render={({ field }) => (<Field data-invalid={Boolean(form.formState.errors.password)}><FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Пароль</FormLabel><FormControl><Input variant="auth" type="password" autoComplete="new-password" placeholder="Минимум 8 символов" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem></Field>)} />
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (<Field data-invalid={Boolean(form.formState.errors.confirmPassword)}><FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Подтвердите пароль</FormLabel><FormControl><Input variant="auth" type="password" autoComplete="new-password" placeholder="Введите пароль ещё раз" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem></Field>)} />
        </FieldGroup>
        <Button variant="brand" size="auth" type="submit" disabled={loading} className="w-full">
          {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null} Создать аккаунт
        </Button>
        <p className="text-center text-sm text-bnr-ash">Уже есть аккаунт? {loading ? <span>Войдите после завершения регистрации.</span> : <Link href="/login" className="font-medium text-bnr-lilac underline-offset-4 hover:underline">Войти</Link>}</p>
      </form>
    </Form>
  );
};

export default RegistrationForm;
