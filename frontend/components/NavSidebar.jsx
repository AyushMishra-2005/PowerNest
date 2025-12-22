"use client"

import React, { useState } from "react"
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar"
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react"
import { motion } from "framer-motion"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useAuth } from "@/context/AuthProvider"

export default function NavSidebar() {
  const [open, setOpen] = useState(false)
  const { authUser } = useAuth();
  console.log(authUser);

  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: (
        <IconBrandTabler className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <IconUserBolt className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <IconSettings className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      href: "/logout",
      icon: (
        <IconArrowLeft className="h-5 w-5 text-neutral-800 dark:text-neutral-200" />
      ),
    },
  ]

  const handleLinkClick = () => {

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOpen(false)
    }
  }

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 text-neutral-900 dark:text-neutral-100">
        <div className="flex flex-col gap-2">
          <div className={`hidden md:block ${!open ? "m-2 mb-0" : "mt-2"}`}>
            {open ? <Logo /> : <LogoIcon />}
          </div>


          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                onClick={handleLinkClick}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center px-2 cursor-pointer">
            <AnimatedThemeToggler />
          </div>

          {
            authUser?.user && <SidebarLink
              link={{
                label: `${authUser?.user?.name}`,
                href: "#",
                icon: (
                  <motion.img
                    src={authUser.user.profilePicURL}
                    alt="Avatar"
                    className="shrink-0 rounded-full"
                    initial={false}
                    animate={{
                      width: open ? 40 : 28,
                      height: open ? 40 : 28,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                    }}
                  />
                ),
              }}
              onClick={handleLinkClick}
            />
          }

        </div>
      </SidebarBody>
    </Sidebar>
  )
}

const Logo = () => (
  <div className="flex items-center gap-2 px-2">
    <div className="h-5 w-6 rounded bg-neutral-900 dark:bg-neutral-100" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-medium whitespace-pre text-neutral-900 dark:text-neutral-100"
    >
      PowerNest
    </motion.span>
  </div>
)

const LogoIcon = () => (
  <div className="h-5 w-6 rounded bg-neutral-900 dark:bg-neutral-100" />
)