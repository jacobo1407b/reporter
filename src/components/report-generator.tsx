"use client"

import { useState, useCallback } from "react";
import FormData from "./steps/FormData";
import Signal from "./steps/Signal";
import Excel from "./steps/Excel";
import { useRegistro } from "./IndexDB";
import { Button, Progress } from "@heroui/react";
import { Download, Clock, AlertCircle } from "lucide-react";
import { StepIndicator } from "./step-indicator";
import { handlerReaFiles } from "@/utils";
import { dataToPdf } from "@/utils/pdf";


type FormDataType = {
  name: string;
  cliente: string;
  proyecto: string;
  autorizo: string;
  periodo: {
    start: number | null;
    end: number | null;
  }
}

const STEPS = [
  { number: 1, label: "Datos del proyecto" },
  { number: 2, label: "Firma" },
  { number: 3, label: "Archivos Excel" },
]


export function ReportGenerator() {

  const { registro, agregar, actualizar } = useRegistro();

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    cliente: "",
    proyecto: "Toks - Proyecto de reingeniería Cadena de Suministro",
    autorizo: "Jose Rojas Hernandez",
    periodo: {
      start: null,
      end: null
    }
  });

  const [signatureFiles, setSignatureFiles] = useState<File[]>([])
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [excelFiles, setExcelFiles] = useState<File[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const isStep1Complete =
    formData.name.trim().length > 0 &&
    formData.cliente.trim().length > 0 &&
    formData.proyecto.trim().length > 0 &&
    formData.autorizo.trim().length > 0 &&
    formData.periodo.start !== null &&
    formData.periodo.end !== null

  const currentStep = isStep1Complete
    ? signatureFiles.length > 0
      ? excelFiles.length > 0
        ? 4
        : 3
      : 2
    : 1

  const handleSignatureChange = useCallback((files: File[]) => {
    setSignatureFiles(files)
    setError(null)
    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSignaturePreview(e.target?.result as string)
      }
      reader.readAsDataURL(files[0])
    } else {
      setSignaturePreview(null)
    }
  }, [])

  const handleExcelChange = useCallback((files: File[]) => {
    setExcelFiles(files);
    setError(null);
  }, [])

  const canGenerate =
    isStep1Complete &&
    signatureFiles.length > 0 &&
    excelFiles.length > 0

  const generateReport = async () => {
    if (!canGenerate) return
    if (registro) {
      await actualizar({
        nombreEmpleado: formData.name,
        nombreCliente: formData.cliente,
        firma: signatureFiles[0]
      })
    } else {
      agregar({
        firma: signatureFiles[0],
        nombreEmpleado: formData.name,
        nombreCliente: formData.cliente
      })
    }
    setIsGenerating(true);
    setError(null);


    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const dataExcel = await handlerReaFiles(excelFiles, formData.proyecto);
      const dataFilter = dataExcel.filter((i) => i.fecha >= (formData.periodo.start ?? 0) && i.fecha <= (formData.periodo.end ?? Date.now()))
      dataToPdf(dataFilter, formData.autorizo, formData.name, signaturePreview || "", formData.cliente);

    } catch (err) {
      console.error(err)
      setError("Error al generar el reporte. Verifica tus archivos e intenta de nuevo.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2.5">
            <Clock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">
              Generador de Reporte de Tiempos
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa los pasos para generar tu reporte en PDF
            </p>
          </div>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Project Data */}
      <FormData
        formData={formData}
        setformData={setFormData}
        isStep1Complete={isStep1Complete} />

      {/* Step 2: Signature */}
      <Signal
        setSignaturePreview={setSignaturePreview}
        setSignatureFiles={handleSignatureChange}
        signatureFiles={signatureFiles}
        signaturePreview={signaturePreview}
        error={error}
      />

      {/* Step 3: Excel Files */}
      <Excel
        excelFiles={excelFiles}
        handleExcelChange={handleExcelChange}
      />

      {/* Generate Button */}
      <div className="flex flex-col gap-3">
        {isGenerating && (
          <Progress
            size="sm"
            isIndeterminate
            color="primary"
            aria-label="Generando reporte..."
            className="w-full"
          />
        )}

        <Button
          size="lg"
          color="primary"
          className="w-full text-base font-bold"
          startContent={!isGenerating && <Download className="h-5 w-5" />}
          isDisabled={!canGenerate}
          isLoading={isGenerating}
          onPress={generateReport}
        >
          {isGenerating
            ? "Generando Reporte..."
            : "Generar y Descargar Reporte"}
        </Button>

        {!canGenerate && (
          <p className="text-center text-xs text-muted-foreground">
            Completa todos los pasos para poder generar el reporte
          </p>
        )}
      </div>
    </div>
  )
}
