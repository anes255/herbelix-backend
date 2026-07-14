import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/utils/prisma.js";

// Creates the default admin + settings row if they don't exist.
async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin "${username}" already exists — skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.admin.create({ data: { username, passwordHash } });
    console.log(`✅ Created admin "${username}".`);
    console.log(`   Password: ${password}  (change it after first login)`);
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.settings.create({
      data: {
        id: 1,
        siteName: "التحقق من أصالة المنتج",
        supportPhone: "+213779452212",
      },
    });
    console.log("✅ Created default settings.");
  } else {
    console.log("Settings already exist — skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
