"use client";
import { logout } from "@/actions/auth";
import React from "react";
import { Button } from "../ui/button";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LogoutBtnProps {
  className?: string;
}

const LogoutBtn = ({ className }: LogoutBtnProps) => {
  const t = useTranslations("auth");
  return (
    <Button
      variant="destructive"
      className={cn("w-full", className)}
      onClick={() => logout()}
    >
      <LogOutIcon className="mr-1" />
      {t("logout")}
    </Button>
  );
};

export default LogoutBtn;
