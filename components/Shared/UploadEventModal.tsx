import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import CurrentUserAvatar from "./CurrentUserAvatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Upload, X, CalendarDays, Ticket, Users } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { createEvent, getSignedURL } from "@/actions/event";
import ErrorMessage from "./ErrorMessage";
import { useParams } from "next/navigation";
import { EventType, UserRole } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BangladeshStates from "@/data/bangladesh-states";
import { computeSHA256 } from "@/utils/computeHash";
import VerifiedBadge from "./VerifiedBadge";
import { analytics } from "@/utils/analytics";
import { useFirstAction } from "@/hooks/use-first-action";
import { useTranslations } from "next-intl";

type UploadEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isStatus: boolean;
};

const UploadEventModal = ({
  isOpen,
  onClose,
  isStatus,
}: UploadEventModalProps) => {
  const t = useTranslations("upload");
  const tc = useTranslations("common");
  const user = useCurrentUser();
  const markFirstAction = useFirstAction();

  const params = useParams<{ stateName: string }>();

  const [file, setFile] = React.useState<File | undefined>();
  const [content, setContent] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stateName, setStateName] = React.useState<string>(
    params.stateName || BangladeshStates[1].slug
  );
  const [eventDate, setEventDate] = React.useState<string>("");
  const [ticketPrice, setTicketPrice] = React.useState<string>("");
  const [maxAttendees, setMaxAttendees] = React.useState<string>("");

  const resetData = () => {
    setFile(undefined);
    setContent("");
    setEventDate("");
    setTicketPrice("");
    setMaxAttendees("");
    setError(null);
  };

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".tiff",
      ],
      "video/*": [".mp4", ".mkv", ".webm", ".avi", ".mov", ".flv", ".wmv"],
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 10, // 10MB
  });

  useEffect(() => {
    setFile(acceptedFiles[0]);
  }, [acceptedFiles]);

  const uploadEventHandler = async () => {
    setError(null);
    setIsUploading(true);

    if (content.trim() === "") {
      setError(t("emptyContent"));
      setIsUploading(false);
      return;
    }

    try {
      analytics.postCreated(isStatus ? "POST" : "EVENT", stateName);
      markFirstAction("post");
      if (file) {
        const checkSum = await computeSHA256(file);
        const signedUrlResult = await getSignedURL(
          file.type,
          file.size,
          checkSum
        );

        if (signedUrlResult.error !== undefined) {
          setError(signedUrlResult.error);
          setIsUploading(false);
          return;
        }

        const { url, publicUrl } = signedUrlResult.success;

        const res = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!res.ok) {
          setError(t("uploadFailed"));
          setIsUploading(false);
          return;
        }

        const createEventResult = await createEvent({
          content,
          type: file.type.includes("image") ? "image" : "video",
          url: publicUrl,
          stateName,
          eventType: isStatus ? EventType.STATUS : EventType.EVENT,
          eventDate: !isStatus && eventDate ? eventDate : undefined,
          ticketPrice: ticketPrice ? parseFloat(ticketPrice) : undefined,
          maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        });

        if (createEventResult.error !== undefined) {
          setError(createEventResult.error);
          return;
        }
        resetData();
        onClose();
        return;
      }

      const createEventResult = await createEvent({
        content,
        stateName,
        eventType: isStatus ? EventType.STATUS : EventType.EVENT,
        eventDate: !isStatus && eventDate ? eventDate : undefined,
        ticketPrice: ticketPrice ? parseFloat(ticketPrice) : undefined,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      });

      if (createEventResult.error !== undefined) {
        setError(createEventResult.error);
        return;
      }

      resetData();
      onClose();
    } catch (err) {
      setError(tc("somethingWentWrong"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isStatus ? t("postStatus") : t("postEvent")} in{" "}
            <Select
              value={stateName}
              onValueChange={(value) => setStateName(value as string)}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder={t("theme")} />
              </SelectTrigger>
              <SelectContent>
                {BangladeshStates.map((state) => (
                  <SelectItem key={state.id} value={state.slug}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DialogTitle>
        </DialogHeader>
        {stateName === "all-districts" && user?.role === UserRole.USER ? (
          <>
            <div className="mt-4">
              <p>
                {t("allDistrictsWarning")}
              </p>
            </div>
            <Button className="mt-4" onClick={onClose} variant="destructive">
              {tc("close")}
            </Button>
          </>
        ) : (
          <>
            <div className="max-h-[60vh] overflow-y-auto px-2 custom-scrollbar">
              <div>
                <div className="flex items-center gap-2">
                  <CurrentUserAvatar />
                  <h1 className="text-lg font-semibold">{user?.name}</h1>
                  <VerifiedBadge userRole={user?.role || UserRole.USER} />
                </div>
                <Textarea
                  placeholder={t("whatsOnMind")}
                  className="mt-4 resize-none min-h-40"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>
              {!isStatus && (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <Label htmlFor="eventDate" className="text-sm text-muted-foreground">
                        {t("eventDateTime")}
                      </Label>
                      <Input
                        id="eventDate"
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <Label htmlFor="ticketPrice" className="text-sm text-muted-foreground">
                          {t("ticketPrice")}
                        </Label>
                        <Input
                          id="ticketPrice"
                          type="number"
                          min="1"
                          placeholder={t("ticketPricePlaceholder")}
                          value={ticketPrice}
                          onChange={(e) => setTicketPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <Label htmlFor="maxAttendees" className="text-sm text-muted-foreground">
                          {t("maxAttendees")}
                        </Label>
                        <Input
                          id="maxAttendees"
                          type="number"
                          min="1"
                          placeholder={t("maxAttendeesPlaceholder")}
                          value={maxAttendees}
                          onChange={(e) => setMaxAttendees(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <section className="text-center mt-4 border-2 border-dashed border-slate-200 p-4 rounded-sm h-24 flex items-center justify-center flex-col cursor-pointer transition-all duration-200 ease-in hover:bg-slate-100 dark:hover:bg-neutral-700">
                <div {...getRootProps({ className: "dropzone" })}>
                  <input {...getInputProps()} />
                  <Upload className="text-4xl mx-auto mb-2" />
                  <p>
                    {t("dragDrop")}
                  </p>
                </div>
              </section>
              {file && (
                <div className="gap-4 mt-4">
                  <div key={file.name} className="relative">
                    {file.type.includes("image") ? (
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        width={200}
                        height={200}
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    <Button
                      size="iconRounded"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => setFile(undefined)}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {error && <ErrorMessage message={error} />}

            <Button
              className="mt-4"
              onClick={uploadEventHandler}
              disabled={isUploading}
            >
              {isUploading ? tc("uploading") : tc("post")}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadEventModal;
