import { z } from 'zod';

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresIn: z.enum(['1_month', '3_months', '6_months', '12_months', 'never']),
});

export type CreateApiKeyType = z.infer<typeof CreateApiKeySchema>;

