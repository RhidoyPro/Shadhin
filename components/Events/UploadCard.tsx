"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarCheck2Icon, ImageIcon, Video } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import UploadEventModal from "../Shared/UploadEventModal";
import CurrentUserAvatar from "../Shared/CurrentUserAvatar";

const UploadCard = () => {
  const [isEventModalOpen, setEventModalOpen] = useState(false);

  const handleCloseEventModal = () => {
    setEventModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <CurrentUserAvatar />
          <div
            className="bg-slate-100 dark:bg-neutral-700 flex-1 px-4 py-2 rounded-full transition-all duration-200 ease-in hover:bg-slate-200 cursor-pointer"
            onClick={() => setEventModalOpen(true)}
          >
            <p>What&apos;s on your mind ?</p>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="hidden xs:flex items-center justify-between gap-3 pb-2 mt-2">
          <Button variant="ghost" onClick={() => setEventModalOpen(true)}>
            <Video className="mr-2" />
            Upload Video
          </Button>
          <Button variant="ghost" onClick={() => setEventModalOpen(true)}>
            <ImageIcon className="mr-2" />
            Upload Photo
          </Button>
          <Button variant="ghost" onClick={() => setEventModalOpen(true)}>
            <CalendarCheck2Icon className="mr-2" />
            Post Events
          </Button>
        </CardContent>
      </Card>
      <UploadEventModal
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
      />
    </>
  );
};

export default UploadCard;
