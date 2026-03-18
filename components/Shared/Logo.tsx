import React from "react";
import Image from "next/image";
import Link from "next/link";
import LogoImg from "@/public/logo.png";
import LogoWhiteImg from "@/public/logo-white.png";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

type ILogoProps = {
  color?: string;
};

const Logo = ({ color = "primary" }: ILogoProps) => {
  if (color === "white") {
    return (
      <Link href={DEFAULT_LOGIN_REDIRECT} className="flex items-center gap-1">
        <Image
          src={LogoWhiteImg}
          alt="Shadhin.io"
          width={40}
          height={40}
          priority
        />
        <h1 className="text-2xl font-semibold text-white">Shadhin.io</h1>
      </Link>
    );
  }

  return (
    <Link href={DEFAULT_LOGIN_REDIRECT} className="flex items-center gap-1">
      <Image
        src={LogoImg}
        alt="Shadhin.io"
        width={40}
        height={40}
        priority
        className="dark:hidden"
      />
      <Image
        src={LogoWhiteImg}
        alt="Shadhin.io"
        width={40}
        height={40}
        priority
        className="hidden dark:block"
      />
      <h1 className="text-2xl font-semibold text-primary">Shadhin.io</h1>
    </Link>
  );
};

export default Logo;
