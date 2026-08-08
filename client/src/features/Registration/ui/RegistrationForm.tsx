"use client";

import userService from "@/entities/user-service";
import { formRegisterSchema, TFormRegisterValues } from "@/shared/constants/validateSchemas";
import AuthStore from "@/shared/store/auth";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup } from "@/shared/ui/field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
};

const errorMessage = (cause: unknown) => {
  if (!isAxiosError(cause) || !cause.response) return "Сервер недоступен. Проверьте подключение и попробуйте ещё раз.";
  if (cause.response.status === 409) return "Аккаунт с таким email уже существует.";
  if (cause.response.status === 429) return "Слишком много запросов. Попробуйте немного позже.";
  if (cause.response.status === 503) return "Почтовый сервис временно недоступен. Аккаунт не был создан.";
  return "Не удалось зарегистрировать аккаунт. Проверьте данные и попробуйте ещё раз.";
};

export const RegistrationForm = () => {
  const registration = AuthStore((state) => state.registration);
  const loading = AuthStore((state) => state.isLoading);
  const router = useRouter();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const form = useForm<TFormRegisterValues>({ resolver: zodResolver(formRegisterSchema), defaultValues: { email: "", password: "", confirmPassword: "" } });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (data: TFormRegisterValues) => {
    try {
      await registration({ email: data.email, password: data.password, router });
      setSentEmail(data.email);
      setCooldown(60);
    } catch (cause) {
      form.setError("root", { message: errorMessage(cause) });
    }
  };

  const resend = async () => {
    if (!sentEmail || cooldown > 0) return;
    setResendState("loading");
    setResendError(null);
    try {
      await userService.resendActivation(sentEmail);
      setResendState("sent");
      setCooldown(60);
    } catch (cause) {
      setResendError(errorMessage(cause));
      setResendState("idle");
    }
  };

  if (sentEmail) {
    return (
      <div className="flex flex-col items-center gap-6 text-center" role="status" aria-live="polite">
        <span className="grid size-16 place-items-center border border-bnr-lilac/45 bg-bnr-violet/10 text-bnr-lilac">
          <MailCheck aria-hidden="true" className="size-8" />
        </span>
        <div>
          <h2 className="font-cinzel text-xl text-bnr-bone">Проверьте почту</h2>
          <p className="mt-3 text-sm leading-6 text-bnr-ash">Мы отправили ссылку активации на <span className="text-bnr-bone">{maskEmail(sentEmail)}</span>. Ссылка действует 24 часа.</p>
        </div>
        {resendState === "sent" ? <Alert><AlertDescription>Письмо отправлено повторно.</AlertDescription></Alert> : null}
        {resendError ? <Alert variant="destructive"><AlertDescription>{resendError}</AlertDescription></Alert> : null}
        <Button type="button" variant="brand" className="w-full" onClick={resend} disabled={resendState === "loading" || cooldown > 0}>
          {resendState === "loading" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
          {cooldown > 0 ? `Отправить повторно через ${cooldown} с` : "Отправить письмо повторно"}
        </Button>
        <Link href="/login" className="text-sm font-medium text-bnr-lilac underline-offset-4 hover:underline">Вернуться ко входу</Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        {form.formState.errors.root?.message ? <Alert variant="destructive"><AlertDescription>{form.formState.errors.root.message}</AlertDescription></Alert> : null}
        <FieldGroup className="gap-5">
          <FormField control={form.control} name="email" render={({ field }) => (<Field data-invalid={Boolean(form.formState.errors.email)}><FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Email</FormLabel><FormControl><Input variant="auth" type="email" autoComplete="email" placeholder="name@example.com" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem></Field>)} />
          <FormField control={form.control} name="password" render={({ field }) => (<Field data-invalid={Boolean(form.formState.errors.password)}><FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Пароль</FormLabel><FormControl><Input variant="auth" type="password" autoComplete="new-password" placeholder="Минимум 8 символов" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem></Field>)} />
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (<Field data-invalid={Boolean(form.formState.errors.confirmPassword)}><FormItem><FormLabel className="text-[13px] font-medium text-bnr-bone">Подтвердите пароль</FormLabel><FormControl><Input variant="auth" type="password" autoComplete="new-password" placeholder="Введите пароль ещё раз" disabled={loading} {...field} /></FormControl><FormMessage /></FormItem></Field>)} />
        </FieldGroup>
        <Button variant="brand" size="auth" type="submit" disabled={loading} className="w-full">{loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null} Создать аккаунт</Button>
        <p className="text-center text-sm text-bnr-ash">Уже есть аккаунт? <Link href="/login" className="font-medium text-bnr-lilac underline-offset-4 hover:underline">Войти</Link></p>
      </form>
    </Form>
  );
};

export default RegistrationForm;
