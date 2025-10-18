import z from 'zod';

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type LoginType = z.infer<typeof LoginSchema>;

export const CreateUserSchema = z.object({
  email: z.email(),
  role: z.enum(['ADMIN', 'READ_ONLY']),
  password: z.string(),
});

export type CreateUserType = z.infer<typeof CreateUserSchema>;
