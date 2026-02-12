"use client"

import React from "react"
import { RegistroProvider } from "@/components/IndexDB"
import { HeroUIProvider } from "@heroui/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <RegistroProvider>
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  </RegistroProvider>
}
