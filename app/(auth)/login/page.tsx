import React from "react";
import type { Metadata } from "next";
import LoginForm from "./form";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to Shadhin.io — Bangladesh's district-based social platform.",
};

const NewLoginPage = () => {
  return (
    <div className="bg-red-600 h-screen flex flex-col gap-4 justify-center items-center overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-white">
        স্বাধীনতা অর্জন করার চেয়ে স্বাধীনতা রক্ষা করা কঠিন
      </h1>
      <div className="w-[600px] h-[600px] rounded-full bg-green-800 flex justify-center items-center flex-col">
        <LoginForm />
      </div>
    </div>
  );
};

export default NewLoginPage;
