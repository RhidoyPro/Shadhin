import React from "react";
import { ReportsDataTable } from "./data-table";
import { getLatestReports } from "@/data/reports";

const ReportsPage = async () => {
  const reports = await getLatestReports();
  return (
    <div>
      <div className="mt-4">
        <ReportsDataTable reports={reports} />
      </div>
    </div>
  );
};

export default ReportsPage;
