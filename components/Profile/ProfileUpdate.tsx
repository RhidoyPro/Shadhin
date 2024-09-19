"use client";
import React from "react";
import { Button } from "../ui/button";
import UpdateProfileModal from "./UpdateProfileModal";
import { User } from "@prisma/client";

type ProfileUpdateProps = {
  user: User;
};

const ProfileUpdate = ({ user }: ProfileUpdateProps) => {
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] =
    React.useState(false);
  return (
    <>
      <Button
        className="mt-4 w-full"
        onClick={() => setIsUpdateProfileModalOpen(true)}
      >
        Update Profile
      </Button>
      <UpdateProfileModal
        isOpen={isUpdateProfileModalOpen}
        onClose={() => setIsUpdateProfileModalOpen(false)}
        user={user}
      />
    </>
  );
};

export default ProfileUpdate;
