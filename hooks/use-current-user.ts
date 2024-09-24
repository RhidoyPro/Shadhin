import { useSession } from "next-auth/react";
import { useEffect } from "react";

export const useCurrentUser = () => {
  const session = useSession();

  useEffect(() => {}, [session]);

  return session?.data?.user;
};
