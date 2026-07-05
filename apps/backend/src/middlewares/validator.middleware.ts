import { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';

export function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.length ? issue.path.join('.') : 'root',
    message: issue.message,
  }));
}

/**
 * Validates `req.body` with a Zod schema after `express.json()`.
 * On success, replaces `req.body` with the parsed value.
 */
export function validate<Schema extends ZodType>(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      console.log("Zod Error Detail:", JSON.stringify(result.error.format(), null, 2));
      return res.status(422).json({
        message: 'Validation error',
        errors: formatZodIssues(result.error),
      });
    }

    req.body = result.data;
    next();
  };
}