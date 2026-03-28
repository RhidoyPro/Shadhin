"use client";
import React from "react";
import { Button } from "../ui/button";
import UpdateProfileModal from "./UpdateProfileModal";
import { User } from "@prisma/client";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

type ProfileUpdateProps = {
  user: User;
};

const ProfileUpdate = ({ user }: ProfileUpdateProps) => {
  const t = useTranslations("profile");
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] =
    React.useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="default"
        className="mt-4 rounded-full px-6 gap-2"
        onClick={() => setIsUpdateProfileModalOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        {t("editProfile")}
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
