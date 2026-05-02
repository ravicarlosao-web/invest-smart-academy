// @ts-nocheck
import type { Request, Response, NextFunction } from "express";

type ZodIssue = { path: (string | number)[]; message: string };
type ZodLike = {
  safeParse(data: unknown):
    | { success: true; data: unknown }
    | { success: false; error: { errors: ZodIssue[] } };
};

function formatZodError(errs: ZodIssue[]): string {
  return errs
    .map((e: any) => `${e.path.length ? e.path.join(".") + ": " : ""}${e.message}`)
    .join("; ");
}

/**
 * Express middleware that validates req.body against the given Zod schema.
 * On failure returns 422 with a descriptive Portuguese message.
 * On success, replaces req.body with the parsed (sanitised) value.
 */
export function validate(schema: ZodLike) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error:   "validation_error",
        message: formatZodError(result.error.errors),
        details: result.error.errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
