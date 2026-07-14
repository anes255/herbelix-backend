import { Router } from "express";
import { body } from "express-validator";
import { verifyCode } from "../controllers/verify.controller.js";
import { getPublicSettings } from "../controllers/settings.controller.js";
import { handleValidation } from "../middleware/validate.js";
import { verifyLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post(
  "/verify",
  verifyLimiter,
  body("code")
    .isString()
    .trim()
    .isLength({ min: 1, max: 64 })
    .withMessage("الرجاء إدخال رمز صحيح")
    .matches(/^[A-Za-z0-9\-]+$/)
    .withMessage("الرمز يحتوي على أحرف غير مسموحة"),
  handleValidation,
  verifyCode
);

router.get("/settings", getPublicSettings);

export default router;
