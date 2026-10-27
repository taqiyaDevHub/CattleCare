import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let code = err.code;
  let message = err.message;

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    status = 400;
    code = 'VALIDATION_ERROR';
    message = issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message;
  } else if (err.code === 11000) {
    status = 409;
    if (err.keyPattern?.phone) {
      code = 'PHONE_TAKEN';
      message = 'This phone number is already registered';
    } else if (err.keyPattern?.tag) {
      code = 'TAG_TAKEN';
      message = 'This tag is already used by another animal';
    } else {
      code = 'DUPLICATE';
      message = 'This record already exists';
    }
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Invalid id';
  } else if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
  } else if (!err.status) {
    console.error(err);
    status = 500;
    code = 'SERVER_ERROR';
    message = 'Something went wrong';
  }

  res.status(status).json({ ok: false, error: { code, message } });
}