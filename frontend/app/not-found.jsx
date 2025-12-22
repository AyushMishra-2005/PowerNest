"use client"

import Lottie from "lottie-react"
import animationData from "@/public/lottie/notFount.json"

export default function NotFound() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black">
      <div>
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: "200px", height: "200px" }}
        />
      </div>
    </div>
  )
}
