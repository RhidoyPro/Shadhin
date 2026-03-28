import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarIcon, EditIcon, UserRound } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { UpdateProfileSchema } from "@/utils/zodSchema";
import { toast } from "sonner";
import { User } from "@prisma/client";
import { updateUser } from "@/actions/user";
import { useSession } from "next-auth/react";
import BangladeshStates from "@/data/bangladesh-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useTranslations, useLocale } from "@/components/I18nProvider";

type UpdateProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
};

const UpdateProfileModal = ({
  isOpen,
  onClose,
  user,
}: UpdateProfileModalProps) => {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { update, data: session } = useSession();
  const [file, setFile] = React.useState<File | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined
  );
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [profileImgError, setProfileImgError] = useState(false);

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
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 * 5, // 5MB
  });

  useEffect(() => {
    setFile(acceptedFiles[0]);
  }, [acceptedFiles]);

  const handleSubmit = async (formData: FormData) => {
    const data = {
      email: formData.get("email") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      university: formData.get("university") as string,
      dateOfBirth: date,
      state: formData.get("state") as string,
      bio: formData.get("bio") as string,
    };
    // const phoneNumber = formData.get("phone") as string;
    // if (!isValidPhoneNumber(phoneNumber)) {
    //   toast.error("Please enter a valid phone number");
    //   return;
    // }
    const validatedData = UpdateProfileSchema.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0][0] || tc("invalidInput");
      return toast.error(firstError);
    }

    try {
      const updateUserRes = await updateUser(user.id, data);
      if (updateUserRes.error !== undefined) {
        toast.error(updateUserRes.error);
      }

      if (updateUserRes.message !== undefined) {
        update({
          ...session,
          user: {
            ...session?.user,
            name: `${data.firstName} ${data.lastName}`,
          },
        });
        toast.success(updateUserRes.message);
        onClose();
      }
    } catch (error) {
      toast.error(tc("somethingWentWrong"));
    }
  };

  const uploadProfilePictureHandler = async () => {
    if (!file) {
      return toast.error(tc("invalidInput"));
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || tc("somethingWentWrong"));
        setIsUploading(false);
        return;
      }

      update({
        ...session,
        user: {
          ...session?.user,
          image: result.publicUrl,
        },
      });
      setIsUploading(false);
      setFile(undefined);
      toast.success(tc("updated"));
      onClose();
    } catch (error) {
      console.error("Profile picture upload failed:", error);
      toast.error(tc("somethingWentWrong"));
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("updateProfile")}</DialogTitle>
          <DialogDescription>{t("updateDescription")}</DialogDescription>
        </DialogHeader>
        <div>
          <section className="bg-slate-200 w-28 h-28 rounded-full flex justify-center items-center mx-auto relative">
            <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              {!file && !user?.image && (
                <div className="w-28 h-28 rounded-full flex justify-center items-center cursor-pointer">
                  <UserRound className="text-white" size={32} />
                </div>
              )}
              {user?.image && !file && !profileImgError && (
                <Image
                  src={user.image}
                  alt="profile"
                  className="w-28 h-28 object-cover rounded-full cursor-pointer"
                  width={100}
                  height={100}
                  onError={() => setProfileImgError(true)}
                />
              )}
              {user?.image && !file && profileImgError && (
                <div className="w-28 h-28 rounded-full flex justify-center items-center cursor-pointer">
                  <UserRound className="text-white" size={32} />
                </div>
              )}
              {file && (
                <Image
                  src={URL.createObjectURL(file)}
                  alt="profile"
                  className="w-28 h-28 object-cover rounded-full cursor-pointer"
                  width={100}
                  height={100}
                />
              )}
            </div>
            <button
              {...getRootProps({ className: "dropzone" })}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1"
            >
              <EditIcon className="text-primary" size={20} />
            </button>
          </section>
          {file && (
            <div className="mt-4 flex items-center justify-center">
              <Button onClick={uploadProfilePictureHandler} disabled={isUploading}>
                {isUploading ? tc("uploading") : t("updateImage")}
              </Button>
            </div>
          )}
          <form action={handleSubmit} className="flex flex-col gap-3 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">{ta("firstName")}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder={ta("firstNamePlaceholder")}
                  required
                  defaultValue={user?.firstName || user?.name || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">{ta("lastName")}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder={ta("lastNamePlaceholder")}
                  defaultValue={user?.lastName || ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{ta("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={ta("emailPlaceholder")}
                required
                readOnly
                defaultValue={user?.email || ""}
              />
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <PhoneInput
                placeholder="Enter number"
                defaultCountry="BD"
                international
                id="phone"
                name="phone"
                value={user?.phone || ""}
              />
            </div> */}
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="email">{ta("university")}</Label>
                <Input
                  id="university"
                  name="university"
                  type="text"
                  placeholder={ta("universityPlaceholder")}
                  defaultValue={user?.university || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{ta("dateOfBirth")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>{ta("pickDate")}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      id="dob"
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">{t("bio")}</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder={t("bioPlaceholder")}
                maxLength={300}
                defaultValue={user?.bio || ""}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">{ta("state")}</Label>
              <Select name="state" defaultValue={user?.stateName || ""}>
                <SelectTrigger>
                  <SelectValue placeholder={ta("selectState")} />
                </SelectTrigger>
                <SelectContent id="state">
                  {BangladeshStates.slice(1).map((state) => (
                    <SelectItem key={state.id} value={state.slug}>
                      {locale === "bn" ? state.nameBn : state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="mt-4 w-full">{t("updateProfile")}</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProfileModal;
