"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import {toast} from 'react-hot-toast'
import server from '../../envirnoment.js'
import axios from 'axios'

export default function LogoutPage() {
  const { setAuthUser } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const res = await axios.post(`${server}/user/logout`, {}, { withCredentials: true });
        localStorage.removeItem('authUserData');
        setAuthUser(null);
      } catch (err) {
        console.log(err);
        toast.error("Fail to Logout!");
      }
    }
    handleLogout();
  }, []);

  return null;
}
