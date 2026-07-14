import jwt from "jsonwebtoken";

// Bearer-token auth. The JWT is returned to the client on login and sent back
// in the `Authorization: Bearer <token>` header. No cookies → no CSRF surface,
// and it works reliably across domains (Vercel frontend + Render backend).

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

function getToken(req) {
  const header = req.headers["authorization"] || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}

// Protects admin routes.
export function requireAuth(req, res, next) {
  const token = getToken(req);
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
