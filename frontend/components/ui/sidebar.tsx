"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  Power
} from "lucide-react"


interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-2 py-2 hidden md:flex md:flex-col",
          "bg-white dark:bg-neutral-950",
          "w-[200px] shrink-0 border-r border-neutral-200 dark:border-neutral-800",
          className
        )}
        animate={{
          width: animate ? (open ? "200px" : "60px") : "200px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div
        className={cn(
          "h-14 px-4 py-4 flex md:hidden",
          "items-center justify-between",
          "bg-white dark:bg-neutral-950",
          "w-full border-b border-neutral-200 dark:border-neutral-800",
          "fixed top-0 left-0 z-50"
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center">
            <Power className="h-5 w-5 text-white" />
          </div>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            PowerNest
          </span>
        </div>
        <IconMenu2
          className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {open && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className={cn(
                "fixed h-full w-64 top-0 left-0 z-50",
                "bg-white dark:bg-neutral-950 p-6",
                "flex flex-col justify-between",
                "border-r border-neutral-200 dark:border-neutral-800",
                "md:hidden",
                className
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center">
                      <Power className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      PowerNest
                    </span>
                  </div>
                  <IconX
                    className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
                    onClick={() => setOpen(false)}
                  />
                </div>
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
    // Prevent default only if we need to handle navigation differently
    // e.preventDefault();
  };

  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2",
        "group/sidebar py-2 px-2 rounded-lg",
        "hover:bg-neutral-100 dark:hover:bg-neutral-950",
        "transition-colors duration-150",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm whitespace-pre"
      >
        {link.label}
      </motion.span>
    </a>
  );
};