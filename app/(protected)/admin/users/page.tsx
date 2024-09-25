import React from "react";
import { UsersDataTable } from "./data-table";
import { getAllUsers } from "@/data/user";
import ResendVerificationEmail from "./ResendVerificationEmail";

export const maxDuration = 300;

const AllUsersPage = async () => {
  const users = await getAllUsers();
  return (
    <div>
      <div className="flex items-center gap-3 justify-between">
        <h1 className="text-3xl font-semibold text-primary">Users</h1>
        <ResendVerificationEmail />
      </div>
      <div className="mt-4">
        <UsersDataTable users={users} />
      </div>
    </div>
  );
};

export default AllUsersPage;
