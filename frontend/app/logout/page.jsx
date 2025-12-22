"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthProvider";
import { toast } from "react-hot-toast";
import server from "../../envirnoment.js";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const { setAuthUser } = useAuth();
  const router = useRouter();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    const handleLogout = async () => {
      try {
        await axios.post(
          `${server}/user/logout`,
          {},
          { withCredentials: true }
        );

        localStorage.removeItem("authUserData");
        setAuthUser(null);
        router.replace("/login");
        toast.success("Logged out!");
      } catch (err) {
        console.error(err);
        toast.error("Fail to Logout!");
      }
    };

    handleLogout();
  }, [router, setAuthUser]);

  return null;
}
