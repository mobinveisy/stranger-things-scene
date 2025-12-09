"use client"

import { useState, useEffect } from "react"

export default function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <p
            className="text-xs uppercase tracking-[0.2em] text-primary font-bold animate-pulse"
            style={{ textShadow: "0 0 10px rgba(255, 51, 51, 0.8)" }}
          >
            SCROLL TO EXPLORE
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.15em] text-secondary mt-1"
            style={{ textShadow: "0 0 8px rgba(30, 144, 255, 0.6)" }}
          >
            HAWKINS, 1986
          </p>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <div
            className="w-1 h-4 bg-primary rounded-full animate-bounce"
            style={{
              boxShadow: "0 0 10px rgba(255, 51, 51, 0.8), inset 0 0 5px rgba(255, 51, 51, 0.6)",
            }}
          ></div>
          <div
            className="w-1 h-4 bg-primary rounded-full animate-bounce"
            style={{
              animationDelay: "0.1s",
              boxShadow: "0 0 10px rgba(255, 51, 51, 0.8), inset 0 0 5px rgba(255, 51, 51, 0.6)",
            }}
          ></div>
          <div
            className="w-1 h-4 bg-primary rounded-full animate-bounce"
            style={{
              animationDelay: "0.2s",
              boxShadow: "0 0 10px rgba(255, 51, 51, 0.8), inset 0 0 5px rgba(255, 51, 51, 0.6)",
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}
