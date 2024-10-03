import React, { useEffect } from "react";
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
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { PhoneInput } from "../ui/phone-input";
import { cn } from "@/lib/utils";
import { isValidPhoneNumber } from "react-phone-number-input";
import { UpdateProfileSchema } from "@/utils/zodSchema";
import { toast } from "sonner";
import { User } from "@prisma/client";
import {
  getSignedURLForImage,
  updateUser,
  updateUserImage,
} from "@/actions/user";
import { useSession } from "next-auth/react";
import { computeSHA256 } from "@/utils/computeHash";
import BangladeshStates from "@/data/bangladesh-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  const { update, data: session } = useSession();
  const [file, setFile] = React.useState<File | undefined>();
  const [date, setDate] = React.useState<Date | undefined>(
    user?.dateOfBirth || undefined
  );
  const [isUploading, setIsUploading] = React.useState<boolean>(false);

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
    };
    // const phoneNumber = formData.get("phone") as string;
    // if (!isValidPhoneNumber(phoneNumber)) {
    //   toast.error("Please enter a valid phone number");
    //   return;
    // }
    const validatedData = UpdateProfileSchema.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0][0] || "Invalid input";
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
      toast.error("Failed to update profile");
    }
  };

  const uploadProfilePictureHandler = async () => {
    if (!file) {
      return toast.error("Please select a file to upload");
    }

    setIsUploading(true);

    try {
      const checkSum = await computeSHA256(file);
      const signedUrlResult = await getSignedURLForImage(
        file.type,
        file.size,
        checkSum
      );

      if (signedUrlResult.error !== undefined) {
        toast.error(signedUrlResult.error);
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
        toast.error("Failed to upload file, please try again");
        setIsUploading(false);
        return;
      }

      const updateUserImageResult = await updateUserImage(
        user.id,
        url.split("?")[0]
      );

      if (updateUserImageResult.error !== undefined) {
        toast.error(updateUserImageResult.error);
      }
      update({
        ...session,
        user: {
          ...session?.user,
          image: url.split("?")[0],
        },
      });
      setIsUploading(false);
      setFile(undefined);
      toast.success(updateUserImageResult.message);
      onClose();
      return;
    } catch (error) {
      toast.error("Failed to upload profile picture");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
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
              {user?.image && !file && (
                <Image
                  src={user.image}
                  alt="profile"
                  className="w-28 h-28 object-cover rounded-full cursor-pointer"
                  width={100}
                  height={100}
                />
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
              <Button onClick={uploadProfilePictureHandler}>
                Update Image
              </Button>
            </div>
          )}
          <form action={handleSubmit} className="flex flex-col gap-3 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  required
                  defaultValue={user?.firstName || user?.name || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  defaultValue={user?.lastName || ""}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
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
                <Label htmlFor="email">University Name</Label>
                <Input
                  id="university"
                  name="university"
                  type="text"
                  placeholder="Bangladesh University of Engineering and Technology"
                  defaultValue={user?.university || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Date of Birth</Label>
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
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
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
              <Label htmlFor="state">State</Label>
              <Select name="state" defaultValue={user?.stateName || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent id="state">
                  {BangladeshStates.slice(1).map((state) => (
                    <SelectItem key={state.id} value={state.slug}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="mt-4 w-full">Update Profile</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProfileModal;
