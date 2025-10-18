import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory for validating request data using a Zod schema.
 * @param schema - Zod schema to validate against.
 * @param property - Property of req to validate ('body', 'query', or 'params'). Defaults to 'body'.
 */
export function validateZod<T>(
  schema: ZodSchema<T>,
  property: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[property]);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: 'Validation error', details: result.error });
    }
    req[property] = result.data;
    next();
  };
}
