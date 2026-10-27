// Validates and replaces req.body. ZodError is handled by errorHandler.
export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};