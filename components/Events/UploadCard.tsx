"use client";
import React, { useState } from "react";
import { Calendar, ImageIcon, Video } from "lucide-react";
import { Button } from "../ui/button";
import UploadEventModal from "../Shared/UploadEventModal";
import CurrentUserAvatar from "../Shared/CurrentUserAvatar";

const UploadCard = () => {
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [isStatus, setStatus] = useState(true);

  const handleCloseEventModal = () => {
    setStatus(true);
    setEventModalOpen(false);
  };

  return (
    <>
      <div className="border-b border-border bg-card p-4">
        <div className="flex gap-3">
          <CurrentUserAvatar />
          <div className="flex-1 min-w-0">
            <div
              className="min-h-[44px] rounded-2xl bg-muted/50 px-4 py-2.5 cursor-text transition-all hover:bg-muted/70"
              onClick={() => setEventModalOpen(true)}
            >
              <p className="text-sm text-muted-foreground">What&apos;s on your mind?</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  onClick={() => setEventModalOpen(true)}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">Photo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"
                  onClick={() => setEventModalOpen(true)}
                >
                  <Video className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">Video</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
                  onClick={() => {
                    setStatus(false);
                    setEventModalOpen(true);
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden text-xs sm:inline">Event</span>
                </Button>
              </div>
              <Button
                size="sm"
                className="h-8 rounded-full px-4 text-xs font-medium shadow-md shadow-primary/25"
                onClick={() => setEventModalOpen(true)}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
      <UploadEventModal
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        isStatus={isStatus}
      />
    </>
  );
};

export default UploadCard;
