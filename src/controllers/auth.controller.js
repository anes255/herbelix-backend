import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma.js";
import { signToken } from "../middleware/auth.js";

// POST /api/admin/login  { username, password }
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const admin = await prisma.admin.findUnique({ where: { username } });

    // Constant-ish response to avoid user enumeration.
    const ok = admin
      ? await bcrypt.compare(password, admin.passwordHash)
      : await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinv");

    if (!admin || !ok) {
      return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    const token = signToken({ id: admin.id, username: admin.username });
    // Token returned in the body; the client stores it and sends it as
    // `Authorization: Bearer <token>` on subsequent admin requests.
    return res.json({ username: admin.username, token });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/logout — with Bearer auth, logout is client-side (discard
// the token). Kept for API completeness.
export function logout(req, res) {
  res.json({ ok: true });
}

// GET /api/admin/me
export function me(req, res) {
  res.json({ username: req.admin.username });
}

// PUT /api/admin/password  { currentPassword, newPassword }
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    if (!admin) return res.status(404).json({ error: "الحساب غير موجود" });

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
