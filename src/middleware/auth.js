import jwt from "jsonwebtoken";

const COOKIE_NAME = "herblix_token";

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

// When frontend and backend live on different domains (e.g. Vercel + Render),
// the cookie must be SameSite=None + Secure to be sent on cross-site requests.
const SAME_SITE = process.env.COOKIE_SAMESITE || "lax";
const SECURE = process.env.COOKIE_SECURE === "true" || SAME_SITE === "none";

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: SAME_SITE,
    maxAge: 8 * 60 * 60 * 1000, // 8h
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    secure: SECURE,
    sameSite: SAME_SITE,
  });
}

// Protects admin routes. Reads the JWT from an HttpOnly cookie.
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "الجلسة منتهية أو غير صالحة" });
  }
}

export { COOKIE_NAME };
