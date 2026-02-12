import React from "react"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { Providers } from './providers'

const _inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Generador de Reporte de Tiempos',
  description: 'Herramienta para generar reportes de tiempos a partir de archivos Excel',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
