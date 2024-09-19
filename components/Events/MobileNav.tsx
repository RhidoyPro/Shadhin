import React from "react";
import { Button } from "../ui/button";
import { AwardIcon, HouseIcon, MessageCircleIcon } from "lucide-react";

const MobileNav = () => {
  return (
    <>
      <div className="h-14 md:hidden" />
      <div className="fixed w-full -bottom-1 left-0 bg-primary z-50 px-4 sm:px-8 py-4 flex md:hidden items-center justify-between">
        <Button className="text-white" variant="ghost" size="iconRounded">
          <AwardIcon size={24} />
        </Button>
        <Button className="text-white" variant="ghost" size="iconRounded">
          <HouseIcon size={24} />
        </Button>
        <Button className="text-white" variant="ghost" size="iconRounded">
          <MessageCircleIcon size={24} />
        </Button>
      </div>
    </>
  );
};

export default MobileNav;
