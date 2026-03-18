"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendBroadcastAnnouncement } from "@/actions/broadcast";
import { toast } from "sonner";
import { MegaphoneIcon } from "lucide-react";
import BeatLoader from "react-spinners/BeatLoader";

const BroadcastPage = () => {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    startTransition(() => {
      sendBroadcastAnnouncement(subject, message)
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          if (data.message) {
            toast.success(data.message);
            setSubject("");
            setMessage("");
          }
        })
        .catch(() => {
          toast.error("Failed to send broadcast");
        });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MegaphoneIcon className="h-6 w-6" />
          Broadcast Announcement
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send an email announcement to all verified, active users.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Compose Broadcast</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Important announcement..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isPending}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">
                {subject.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your announcement here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isPending}
                maxLength={5000}
                rows={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/5000 characters
              </p>
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <BeatLoader color="#fff" size={8} />
              ) : (
                "Send Broadcast"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastPage;
