import { getSettings, updateSettings } from "../services/settings.service.js";

// GET /api/settings (public — only safe fields)
export async function getPublicSettings(req, res, next) {
  try {
    const s = await getSettings();
    res.json({ siteName: s.siteName, supportPhone: s.supportPhone, logo: s.logo });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/settings
export async function getAdminSettings(req, res, next) {
  try {
    const s = await getSettings();
    res.json({ siteName: s.siteName, supportPhone: s.supportPhone, logo: s.logo });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/settings
export async function putAdminSettings(req, res, next) {
  try {
    const { siteName, supportPhone, logo } = req.body;
    const data = {};
    if (siteName !== undefined) data.siteName = String(siteName).trim();
    if (supportPhone !== undefined) data.supportPhone = String(supportPhone).trim();
    if (logo !== undefined) data.logo = logo ? String(logo).trim() : null;

    const updated = await updateSettings(data);
    res.json({
      siteName: updated.siteName,
      supportPhone: updated.supportPhone,
      logo: updated.logo,
    });
  } catch (err) {
    next(err);
  }
}
