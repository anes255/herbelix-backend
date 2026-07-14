import crypto from "crypto";

const CSRF_COOKIE = "herblix_csrf";
const CSRF_HEADER = "x-csrf-token";

// Issues a non-HttpOnly CSRF cookie the SPA reads and echoes back in a header.
export function issueCsrf(req, res, next) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token) {
    token = crypto.randomBytes(24).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
    });
  }
  res.locals.csrfToken = token;
  next();
}

// Double-submit check for state-changing admin requests.
export function verifyCsrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "رمز حماية CSRF غير صالح" });
  }
  next();
}

export { CSRF_COOKIE, CSRF_HEADER };
