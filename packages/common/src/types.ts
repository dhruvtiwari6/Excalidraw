import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string(),
  name: z.string(),
});

export const SignInSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string(),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(20),
});
