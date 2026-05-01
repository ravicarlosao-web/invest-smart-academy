import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny, ZodError } from "zod";

function formatZodError(err: ZodError): string {
  return err.errors
    .map((e) => `${e.path.length ? e.path.join(".") + ": " : ""}${e.message}`)
    .join("; ");
}

/**
 * Express middleware that validates req.body against the given Zod schema.
 * On failure returns 422 with a descriptive Portuguese message.
 * On success, replaces req.body with the parsed (sanitised) value.
 */
export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error:   "validation_error",
        message: formatZodError(result.error),
        details: result.error.errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
