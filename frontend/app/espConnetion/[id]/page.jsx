"use client"

import { ESPConnectionPage } from "@/components/ESPConnectionPage"
import { useParams } from "next/navigation";

export default function page() {
  const { id } = useParams();
  return (
    <ESPConnectionPage roomId={id}/>
  );
}