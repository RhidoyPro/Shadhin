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

const ForbiddenPage = () => {
  return (
    <div className="px-4 h-screen container py-8 flex justify-center items-center flex-col gap-8">
      <Logo />
      <div>
        <Card className="sm:w-[450px] text-center">
          <CardHeader>
            <CardTitle>Forbidden Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-balance text-muted-foreground">
              You tried to access a page that you are not authorized to view.
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-center">
            <Button asChild variant={"link"}>
              <Link href="/">Go back</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForbiddenPage;
