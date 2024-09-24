import React, { useEffect } from "react";
import { track } from "@vercel/analytics";
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
import { Upload, X } from "lucide-react";
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
  const user = useCurrentUser();

  const params = useParams<{ stateName: string }>();

  const [file, setFile] = React.useState<File | undefined>();
  const [content, setContent] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stateName, setStateName] = React.useState<string>(
    params.stateName || BangladeshStates[1].slug
  );

  const resetData = () => {
    setFile(undefined);
    setContent("");
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
      setError("Please write some content before posting");
      setIsUploading(false);
      return;
    }

    try {
      track("upload_event");
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

        const { url } = signedUrlResult.success;

        const res = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        if (!res.ok) {
          setError("Failed to upload file, please try again");
          setIsUploading(false);
          return;
        }

        const createEventResult = await createEvent({
          content,
          type: file.type.includes("image") ? "image" : "video",
          url: url.split("?")[0],
          stateName,
          eventType: isStatus ? EventType.STATUS : EventType.EVENT,
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
      });

      if (createEventResult.error !== undefined) {
        setError(createEventResult.error);
        return;
      }

      resetData();
      onClose();
    } catch (err) {
      setError("Something went wrong, please try again");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isStatus ? "Post Status" : "Post Event"} in{" "}
            <Select
              value={stateName}
              onValueChange={(value) => setStateName(value as string)}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Theme" />
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
        {stateName === "all-states" && user?.role === UserRole.USER ? (
          <>
            <div className="mt-4">
              <p>
                You are not allowed to post events in all states. Only selected
                users can post events in all states.
              </p>
            </div>
            <Button className="mt-4" onClick={onClose} variant="destructive">
              Close
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
                  placeholder="What's on your mind?"
                  className="mt-4 resize-none min-h-40"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <section className="text-center mt-4 border-2 border-dashed border-slate-200 p-4 rounded-sm h-24 flex items-center justify-center flex-col cursor-pointer transition-all duration-200 ease-in hover:bg-slate-100 dark:hover:bg-neutral-700">
                <div {...getRootProps({ className: "dropzone" })}>
                  <input {...getInputProps()} />
                  <Upload className="text-4xl mx-auto mb-2" />
                  <p>
                    Drag &apos;n&apos; drop image or video you want to upload
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
              {isUploading ? "Uploading..." : "Post"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadEventModal;
