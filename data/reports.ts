import { db } from "@/lib/db";

export const getLatestReports = async () => {
  const reports = await db.report.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      event: {
        include: {
          user: true,
        },
      },
    },
  });
  return reports;
};
