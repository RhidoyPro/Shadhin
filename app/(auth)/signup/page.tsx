"use client";
import Image from "next/image";
import Link from "next/link";
import { track } from "@vercel/analytics";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import Logo from "@/components/Shared/Logo";
import { login, signup } from "@/actions/auth";
import { useFormStatus } from "react-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { useFormState } from "react-dom";
import { isValidPhoneNumber } from "react-phone-number-input";
import { SignupSchema } from "@/utils/zodSchema";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import BangladeshStates from "@/data/bangladesh-states";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <ClipLoader size={14} color="#fff" className="mr-1" />}
      {pending ? "Signing up" : "Signup"}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signup, null);

  const [date, setDate] = useState<Date>();

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    }
    if (state.message) {
      toast.success(state.message);
      redirect("/login");
    }
  }, [state]);

  const handleSubmit = (formData: FormData) => {
    track("signup_email");
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      university: formData.get("university") as string,
      dateOfBirth: date,
      state: formData.get("state") as string,
    };
    console.log(data);
    const phoneNumber = formData.get("phone") as string;
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    const validatedData = SignupSchema.safeParse(data);

    if (!validatedData.success) {
      const errors = validatedData.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0][0] || "Invalid input";
      return toast.error(firstError);
    }
    formAction(data);
  };

  return (
    <div className="w-full grid lg:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center py-12 px-4">
        <form action={handleSubmit} className="mx-auto grid sm:w-[450px] gap-6">
          <div className="mx-auto">
            <Logo />
          </div>
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Signup</h1>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
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
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <PhoneInput
                  placeholder="Enter number"
                  defaultCountry="BD"
                  international
                  id="phone"
                  name="phone"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Select name="state">
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
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="email">University Name (Optional)</Label>
                <Input
                  id="university"
                  name="university"
                  type="text"
                  placeholder="Bangladesh University of Engineering and Technology"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Date of Birth (Optional)</Label>
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
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <SubmitButton />
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => {
                track("signup_google");
                login("google");
              }}
            >
              <Image
                src={"/google.svg"}
                width={20}
                height={20}
                alt="Google"
                className="mr-2"
              />
              Signup with Google
            </Button>
          </div>
          <div className="mt-2 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </form>
      </div>
      <div className="hidden bg-muted lg:block">
        <Image
          src="/bangladesh.jpg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
