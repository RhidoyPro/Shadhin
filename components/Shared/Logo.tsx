import React from "react";
import Image from "next/image";
import Link from "next/link";
import LogoImg from "@/public/logo.png";
import LogoWhiteImg from "@/public/logo-white.png";

type ILogoProps = {
  color?: string;
};

const Logo = ({ color = "primary" }: ILogoProps) => {
  return (
    <Link href="/" className="flex items-center gap-1">
      <Image
        src={color === "white" ? LogoWhiteImg : LogoImg}
        alt="Shadhin.io"
        width={40}
        height={40}
        priority
      />
      <h1 className={`text-2xl font-semibold text-${color}`}>Shadhin.io</h1>
    </Link>
  );
};

export default Logo;
