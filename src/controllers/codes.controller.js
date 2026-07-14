import { prisma } from "../utils/prisma.js";

// GET /api/admin/codes?page=&limit=&search=&filter=
// filter: all | enabled | disabled | most-verified | recent
export async function listCodes(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = String(req.query.search || "").trim();
    const filter = String(req.query.filter || "all");

    const where = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { batchNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (filter === "enabled") where.enabled = true;
    if (filter === "disabled") where.enabled = false;

    let orderBy = { createdAt: "desc" };
    if (filter === "most-verified") orderBy = { verifiedCount: "desc" };
    if (filter === "recent") orderBy = { createdAt: "desc" };

    const [total, items] = await Promise.all([
      prisma.verificationCode.count({ where }),
      prisma.verificationCode.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/code
export async function createCode(req, res, next) {
  try {
    const { code, productName, description, batchNumber, productionDate, enabled } =
      req.body;

    const created = await prisma.verificationCode.create({
      data: {
        code: String(code).trim().toUpperCase(),
        productName: String(productName).trim(),
        description: description?.trim() || null,
        batchNumber: batchNumber?.trim() || null,
        productionDate: productionDate ? new Date(productionDate) : null,
        enabled: enabled !== false,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "هذا الرمز موجود مسبقاً" });
    }
    next(err);
  }
}

// PUT /api/admin/code/:id
export async function updateCode(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { code, productName, description, batchNumber, productionDate, enabled } =
      req.body;

    const data = {};
    if (code !== undefined) data.code = String(code).trim().toUpperCase();
    if (productName !== undefined) data.productName = String(productName).trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (batchNumber !== undefined) data.batchNumber = batchNumber?.trim() || null;
    if (productionDate !== undefined)
      data.productionDate = productionDate ? new Date(productionDate) : null;
    if (enabled !== undefined) data.enabled = Boolean(enabled);

    const updated = await prisma.verificationCode.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "الرمز غير موجود" });
    if (err.code === "P2002") return res.status(409).json({ error: "هذا الرمز موجود مسبقاً" });
    next(err);
  }
}

// DELETE /api/admin/code/:id
export async function deleteCode(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.verificationCode.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "الرمز غير موجود" });
    next(err);
  }
}

// PATCH /api/admin/code/:id/toggle
export async function toggleCode(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const current = await prisma.verificationCode.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: "الرمز غير موجود" });

    const updated = await prisma.verificationCode.update({
      where: { id },
      data: { enabled: !current.enabled },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/codes/import  { codes: [{ code, productName, ... }] }
export async function importCodes(req, res, next) {
  try {
    const codes = Array.isArray(req.body.codes) ? req.body.codes : [];
    if (codes.length === 0) return res.status(400).json({ error: "لا توجد رموز للاستيراد" });
    if (codes.length > 20000)
      return res.status(400).json({ error: "الحد الأقصى 20000 رمز في المرة" });

    const data = codes
      .filter((c) => c && c.code && c.productName)
      .map((c) => ({
        code: String(c.code).trim().toUpperCase(),
        productName: String(c.productName).trim(),
        description: c.description ? String(c.description).trim() : null,
        batchNumber: c.batchNumber ? String(c.batchNumber).trim() : null,
        productionDate: c.productionDate ? new Date(c.productionDate) : null,
        enabled: c.enabled !== false,
      }));

    const result = await prisma.verificationCode.createMany({
      data,
      skipDuplicates: true,
    });
    res.json({ imported: result.count, received: codes.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/codes/export  -> CSV
export async function exportCodes(req, res, next) {
  try {
    const rows = await prisma.verificationCode.findMany({
      orderBy: { createdAt: "asc" },
    });
    const header = [
      "code",
      "productName",
      "batchNumber",
      "enabled",
      "verifiedCount",
      "createdAt",
      "lastVerifiedAt",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.code,
          r.productName,
          r.batchNumber || "",
          r.enabled ? "Yes" : "No",
          r.verifiedCount,
          r.createdAt.toISOString(),
          r.lastVerifiedAt ? r.lastVerifiedAt.toISOString() : "",
        ]
          .map(esc)
          .join(",")
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="codes.csv"');
    res.send("﻿" + lines.join("\n"));
  } catch (err) {
    next(err);
  }
}
