import { z } from 'zod';

export const AnalyticsQuerySchema = z.object({
  start_date: z.string(),
  end_date: z.string(),
  granularity: z.enum(['hour', 'day']).optional().default('day'),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

