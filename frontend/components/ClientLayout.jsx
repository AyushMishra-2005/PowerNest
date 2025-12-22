"use client";

import NavSidebar from "@/components/NavSidebar";
import { useAuth } from "@/context/AuthProvider";
import { useEffect } from "react";
import {useRouter, usePathname} from 'next/navigation';

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function ClientLayout({ children }) {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if(loading) return;

    if(!authUser && !PUBLIC_ROUTES.includes(pathname)){
      router.replace("/login");
    }

    if(authUser && PUBLIC_ROUTES.includes(pathname)){
      router.replace("/");
    }

  }, [authUser, loading, pathname, router]);

  if(loading){
    return null;
  }


  if (!authUser) {
    return (
      <main className="h-screen w-screen bg-gray-50 dark:bg-black">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
        {children}
      </main>
    </div>
  );
}
