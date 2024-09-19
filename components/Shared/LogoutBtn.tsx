"use client";
import { logout } from "@/actions/auth";
import React from "react";
import { Button } from "../ui/button";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutBtnProps {
  className?: string;
}

const LogoutBtn = ({ className }: LogoutBtnProps) => {
  return (
    <Button
      variant="destructive"
      className={cn("w-full", className)}
      onClick={() => logout()}
    >
      <LogOutIcon className="mr-1" />
      Log out
    </Button>
  );
};

export default LogoutBtn;
