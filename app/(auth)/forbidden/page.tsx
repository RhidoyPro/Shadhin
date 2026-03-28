import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/Shared/Logo";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { getTranslations } from "next-intl/server";

const ForbiddenPage = async () => {
  const t = await getTranslations("forbidden");
  return (
    <div className="px-4 h-screen container py-8 flex justify-center items-center flex-col gap-8">
      <Logo />
      <div>
        <Card className="sm:w-[450px] text-center">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-balance text-muted-foreground">
              {t("description")}
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-center">
            <Button asChild variant={"link"}>
              <Link href={DEFAULT_LOGIN_REDIRECT}>{t("goBack")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForbiddenPage;
