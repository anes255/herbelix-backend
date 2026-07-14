import { prisma } from "../utils/prisma.js";

// Ensures the singleton Settings row (id = 1) exists and returns it.
export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 1 } });
  }
  return settings;
}

export async function updateSettings(data) {
  await getSettings(); // guarantee the row exists
  return prisma.settings.update({ where: { id: 1 }, data });
}
