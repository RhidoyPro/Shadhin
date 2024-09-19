"use client";
import React from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

function MainLoading() {
  return (
    <div className="container px-4 h-screen flex items-center justify-center">
      <ScaleLoader color="#16a34a" />
    </div>
  );
}

export default MainLoading;
