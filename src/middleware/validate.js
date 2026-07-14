import { validationResult } from "express-validator";

// Collects express-validator errors into a single 400 response.
export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "بيانات غير صالحة",
      details: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}
