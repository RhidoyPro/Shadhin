import React from "react";
import { UsersDataTable } from "./data-table";
import { getAllUsers } from "@/data/user";

const AllUsersPage = async () => {
  const users = await getAllUsers();
  return (
    <div>
      <h1 className="text-3xl font-semibold text-primary">Users</h1>
      <div className="mt-4">
        <UsersDataTable users={users} />
      </div>
    </div>
  );
};

export default AllUsersPage;
