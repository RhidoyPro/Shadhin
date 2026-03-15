"use client";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function UserProfileLoading() {
  return (
    <div className="container px-4 h-screen flex items-center justify-center">
      <ScaleLoader color="#16a34a" />
    </div>
  );
}
