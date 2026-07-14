import express from "express";
import helmet from "helmet";
import cors from "cors";

import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  // Behind a proxy (Render/Vercel/etc.) so req.ip reflects the real client.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(express.json({ limit: "5mb" }));

  // CORS — restricted to configured client origins, credentials enabled.
  // CLIENT_ORIGIN is a comma-separated list. Entries may use a "*" wildcard
  // for subdomains, e.g. "https://*.vercel.app" to allow Vercel preview URLs.
  const patterns = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  function isAllowedOrigin(origin) {
    return patterns.some((p) => {
      if (p === origin) return true;
      if (p.includes("*")) {
        const re = new RegExp(
          "^" + p.replace(/[.]/g, "\\.").replace(/\*/g, "[^.]+") + "$"
        );
        return re.test(origin);
      }
      return false;
    });
  }

  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server (no Origin header) and whitelisted origins.
        if (!origin || isAllowedOrigin(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
    })
  );

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api", publicRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
