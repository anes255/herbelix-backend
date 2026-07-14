import { prisma } from "../utils/prisma.js";
import { getSettings } from "../services/settings.service.js";
import { getClientIp, parseUserAgent } from "../utils/request.js";

// Result codes used for logging + client rendering.
const RESULT = {
  AUTHENTIC: "authentic",
  USED_BEFORE: "used_before",
  DISABLED: "disabled",
  NOT_FOUND: "not_found",
};

async function log(req, code, result) {
  const ip = getClientIp(req);
  const { browser, device } = parseUserAgent(req.headers["user-agent"]);
  try {
    await prisma.verificationLog.create({
      data: { verificationCode: code, ipAddress: ip, browser, device, result },
    });
  } catch {
    // Logging must never break the verification response.
  }
}

// POST /api/verify  { code }
export async function verifyCode(req, res, next) {
  try {
    const raw = String(req.body.code || "").trim().toUpperCase();

    const settings = await getSettings();
    const supportPhone = settings.supportPhone;

    const record = await prisma.verificationCode.findUnique({
      where: { code: raw },
    });

    if (!record) {
      await log(req, raw, RESULT.NOT_FOUND);
      return res.status(200).json({
        status: RESULT.NOT_FOUND,
        message: "❌ هذا الرمز غير موجود أو قد يكون المنتج مقلداً.",
        supportPhone,
      });
    }

    if (!record.enabled) {
      await log(req, raw, RESULT.DISABLED);
      return res.status(200).json({
        status: RESULT.DISABLED,
        message: "❌ هذا الرمز غير صالح.",
        supportPhone,
      });
    }

    // Enabled code. First verification vs. re-use.
    const previousCount = record.verifiedCount;
    const now = new Date();
    const firstAt = record.firstVerifiedAt || record.lastVerifiedAt; // best-known first use

    const updated = await prisma.verificationCode.update({
      where: { id: record.id },
      data: {
        verifiedCount: { increment: 1 },
        lastVerifiedAt: now,
        firstVerifiedAt: record.firstVerifiedAt ?? now,
      },
    });

    if (previousCount > 0) {
      // Code has already been verified before — likely re-scanned or copied.
      await log(req, raw, RESULT.USED_BEFORE);
      return res.status(200).json({
        status: RESULT.USED_BEFORE,
        message: "⚠️ الرمز تم استخدامه مسبقًا",
        usedAt: firstAt,
        product: {
          productName: updated.productName,
          productionDate: updated.productionDate,
          description: updated.description,
        },
        supportPhone,
      });
    }

    // First-time verification — authentic.
    await log(req, raw, RESULT.AUTHENTIC);
    return res.status(200).json({
      status: RESULT.AUTHENTIC,
      message: "✅ هذا المنتج أصلي",
      product: {
        productName: updated.productName,
        productionDate: updated.productionDate,
        description: updated.description,
      },
      supportPhone,
    });
  } catch (err) {
    next(err);
  }
}
