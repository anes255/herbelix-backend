import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { handleValidation } from "../middleware/validate.js";
import { loginLimiter, adminLimiter } from "../middleware/rateLimit.js";
import {
  login,
  logout,
  me,
  changePassword,
} from "../controllers/auth.controller.js";
import {
  listCodes,
  createCode,
  updateCode,
  deleteCode,
  toggleCode,
  importCodes,
  exportCodes,
} from "../controllers/codes.controller.js";
import { getStats } from "../controllers/stats.controller.js";
import {
  getAdminSettings,
  putAdminSettings,
} from "../controllers/settings.controller.js";

const router = Router();

// --- Auth ---
router.post(
  "/login",
  loginLimiter,
  body("username").isString().trim().notEmpty(),
  body("password").isString().isLength({ min: 1 }),
  handleValidation,
  login
);
router.post("/logout", logout);

// Everything below requires a valid session.
router.use(requireAuth, adminLimiter);

router.get("/me", me);
router.put(
  "/password",
  body("currentPassword").isString().notEmpty(),
  body("newPassword").isString().isLength({ min: 8 }).withMessage("كلمة المرور 8 أحرف على الأقل"),
  handleValidation,
  changePassword
);

// --- Stats ---
router.get("/stats", getStats);

// --- Codes ---
router.get("/codes", listCodes);
router.get("/codes/export", exportCodes);
router.post(
  "/codes/import",
  body("codes").isArray({ min: 1 }).withMessage("قائمة الرموز مطلوبة"),
  handleValidation,
  importCodes
);
router.post(
  "/code",
  body("code").isString().trim().notEmpty().matches(/^[A-Za-z0-9\-]+$/),
  body("productName").isString().trim().notEmpty(),
  handleValidation,
  createCode
);
router.put(
  "/code/:id",
  param("id").isInt(),
  handleValidation,
  updateCode
);
router.delete("/code/:id", param("id").isInt(), handleValidation, deleteCode);
router.patch("/code/:id/toggle", param("id").isInt(), handleValidation, toggleCode);

// --- Settings ---
router.get("/settings", getAdminSettings);
router.put(
  "/settings",
  body("supportPhone").optional().isString().trim().matches(/^[+0-9\s\-]{5,20}$/),
  body("siteName").optional().isString().trim().isLength({ min: 1, max: 120 }),
  handleValidation,
  putAdminSettings
);

export default router;
