import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Слишком короткий пароль")
  .regex(/[A-Z]/, "Пароль должен содержать хотя бы одну букву Латиницы")
  .regex(/[0-9]/, "Пароль должен содержать хотя бы одно число");

export const formLoginSchema = z.object({
  email: z.string().min(1, "Логин обязателен для заполнения"),
  password: z.string().min(1, "Пароль обязателен для заполнения"),
});
export const formRegisterSchema = z
  .object({
    login: z.string().email("Неверный email"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });
export type TFormLoginValues = z.infer<typeof formLoginSchema>;
export type TFormRegisterValues = z.infer<typeof formRegisterSchema>;
