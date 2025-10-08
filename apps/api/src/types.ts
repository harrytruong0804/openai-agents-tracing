import { z } from 'zod';

// Trace Payload simulates Trace.toJSON() function, which is the expected payload for the API.
export const TracePayloadSchema = z.object({
  object: z.literal('trace'),
  id: z.string(),
  workflow_name: z.string(),
  group_id: z.string().nullable(),
  metadata: z.record(z.string(), z.any()).nullable(),
});

export const SpanErrorSchema = z.object({
  message: z.string(),
  data: z.record(z.string(), z.any()).nullable(),
});

// Span Payload simulates Span.toJSON() function, which is the expected payload for the API.
export const SpanPayloadSchema = z.object({
  object: z.literal('trace.span'),
  id: z.string(),
  trace_id: z.string(),
  parent_id: z.string().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  span_data: z.record(z.string(), z.any()),
  error: SpanErrorSchema.nullable(),
});

export const BodySchema = z.object({
  data: z.array(z.union([SpanPayloadSchema, TracePayloadSchema])),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const SearchQuerySchema = z
  .object({
    trace_id: z.string().optional(),
    group_id: z.string().optional(),
    workflow_name: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sort: z
      .enum(['createdAt', '-createdAt', 'workflow_name', '-workflow_name'])
      .default('-createdAt'),
  })
  .refine(
    (data) =>
      data.trace_id || data.group_id || data.workflow_name || data.metadata || data.start_date || data.end_date,
    {
      message: 'At least one search parameter is required',
    }
  );

export type TracePayload = z.infer<typeof TracePayloadSchema>;
export type SpanPayload = z.infer<typeof SpanPayloadSchema>;
export type SpanError = z.infer<typeof SpanErrorSchema>;
export type Body = z.infer<typeof BodySchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
