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

const AuthErrorPage = () => {
  return (
    <div className="px-4 h-screen container py-8 flex justify-center items-center flex-col gap-8">
      <Logo />
      <div>
        <Card className="sm:w-[450px] text-center">
          <CardHeader>
            <CardTitle>Auth Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-balance text-muted-foreground">
              You tried to login/signup but there was some issue with it. Please
              try again and if the issue persists, contact support.
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-center">
            <Button asChild variant={"link"}>
              <Link href="/login">Go back to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AuthErrorPage;
