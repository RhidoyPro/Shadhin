import { db } from "@/lib/db";

export const getLatestReports = async () => {
  const reports = await db.report.findMany({
    take: 50,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  return reports;
};
