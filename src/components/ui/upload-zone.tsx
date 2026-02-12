"use client"

import React from "react"

import { useCallback, useRef, useState } from "react"
import { Card, CardBody } from "@heroui/react"
import { Upload, X, FileSpreadsheet, ImageIcon } from "lucide-react"

interface UploadZoneProps {
  accept: string
  multiple?: boolean
  label: string
  description: string
  icon: "image" | "excel"
  files: File[]
  onFilesChange: (files: File[]) => void
  preview?: string | null
}

export function UploadZone({
  accept,
  multiple = false,
  label,
  description,
  icon,
  files,
  onFilesChange,
  preview,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      if (multiple) {
        onFilesChange([...files, ...droppedFiles])
      } else {
        onFilesChange(droppedFiles.slice(0, 1))
      }
    },
    [files, multiple, onFilesChange]
  )

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (multiple) {
      onFilesChange([...files, ...selectedFiles])
    } else {
      onFilesChange(selectedFiles.slice(0, 1))
    }
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const IconComponent = icon === "image" ? ImageIcon : FileSpreadsheet

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>

      <Card
        isPressable
        onPress={handleClick}
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 bg-card"
        }`}
        shadow="none"
      >
        <CardBody
          className="flex flex-col items-center justify-center gap-3 py-8"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview || "/placeholder.svg"}
                alt="Vista previa de firma"
                className="max-h-24 rounded-lg object-contain"
              />
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-primary/10 p-3">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Upload className="h-4 w-4" />
                  <span>Haz clic o arrastra archivos aqui</span>
                </div>
                <span className="text-xs text-muted-foreground">{accept}</span>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        aria-label={label}
      />

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2"
            >
              <IconComponent className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Eliminar ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
