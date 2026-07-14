import rateLimit from "express-rate-limit";

// Public verification endpoint — generous but bounded.
export const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "عدد كبير من الطلبات. حاول مجدداً بعد قليل." },
});

// Admin login — strict, to slow down brute-force attempts.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "محاولات تسجيل دخول كثيرة. حاول مجدداً بعد 15 دقيقة." },
});

// General admin API limiter.
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "عدد كبير من الطلبات." },
});
