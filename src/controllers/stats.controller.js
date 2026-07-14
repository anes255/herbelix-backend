import { prisma } from "../utils/prisma.js";

// GET /api/admin/stats
export async function getStats(req, res, next) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalSearches,
      searchesToday,
      authenticSearches,
      fakeSearches,
      disabledSearches,
      totalCodes,
      activeCodes,
      disabledCodes,
      totalVerifiedAgg,
      mostSearched,
      latestSearches,
    ] = await Promise.all([
      prisma.verificationLog.count(),
      prisma.verificationLog.count({ where: { timestamp: { gte: startOfToday } } }),
      prisma.verificationLog.count({ where: { result: "authentic" } }),
      prisma.verificationLog.count({ where: { result: "not_found" } }),
      prisma.verificationLog.count({ where: { result: "disabled" } }),
      prisma.verificationCode.count(),
      prisma.verificationCode.count({ where: { enabled: true } }),
      prisma.verificationCode.count({ where: { enabled: false } }),
      prisma.verificationCode.aggregate({ _sum: { verifiedCount: true } }),
      prisma.verificationCode.findMany({
        where: { verifiedCount: { gt: 0 } },
        orderBy: { verifiedCount: "desc" },
        take: 8,
        select: { code: true, productName: true, verifiedCount: true },
      }),
      prisma.verificationLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 15,
        select: {
          id: true,
          verificationCode: true,
          result: true,
          browser: true,
          device: true,
          ipAddress: true,
          timestamp: true,
        },
      }),
    ]);

    // Last 7 days trend (grouped in JS for portability).
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const recentLogs = await prisma.verificationLog.findMany({
      where: { timestamp: { gte: sevenDaysAgo } },
      select: { timestamp: true, result: true },
    });

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d.toISOString().slice(0, 10),
        total: 0,
        authentic: 0,
        fake: 0,
      });
    }
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
    for (const log of recentLogs) {
      const key = log.timestamp.toISOString().slice(0, 10);
      const bucket = byDate[key];
      if (!bucket) continue;
      bucket.total += 1;
      if (log.result === "authentic") bucket.authentic += 1;
      else bucket.fake += 1;
    }

    res.json({
      totals: {
        totalSearches,
        searchesToday,
        authenticSearches,
        fakeSearches,
        disabledSearches,
        totalCodes,
        activeCodes,
        disabledCodes,
        totalVerifications: totalVerifiedAgg._sum.verifiedCount || 0,
      },
      trend: days,
      mostSearched,
      latestSearches,
    });
  } catch (err) {
    next(err);
  }
}
