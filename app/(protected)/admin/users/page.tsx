import React from "react";
import { UsersDataTable } from "./data-table";
import { getAllUsers } from "@/data/user";
import ResendVerificationEmail from "./ResendVerificationEmail";
import { auth } from "@/auth";

export const maxDuration = 60;

const AllUsersPage = async () => {
  const [users, session] = await Promise.all([getAllUsers(), auth()]);
  const actorRole = session?.user?.role ?? "USER";
  return (
    <div>
      <div className="flex items-center gap-3 justify-between">
        <h1 className="text-3xl font-semibold text-primary">Users</h1>
        <ResendVerificationEmail />
      </div>
      <div className="mt-4">
        <UsersDataTable users={users} actorRole={actorRole} />
      </div>
    </div>
  );
};

export default AllUsersPage;
