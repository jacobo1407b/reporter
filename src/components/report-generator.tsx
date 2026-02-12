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
    formData.autorizo.trim().length > 0

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
      actualizar({
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

    const dataExcel = await handlerReaFiles(excelFiles, formData.proyecto);
    const dataFilter = dataExcel.filter((i) => i.fecha >= (formData.periodo.start ?? 0) && i.fecha <= (formData.periodo.end ?? Date.now()))
    dataToPdf(dataFilter, formData.autorizo, formData.name, signaturePreview || "", formData.cliente);

    try {
      /*await new Promise((resolve) => setTimeout(resolve, 500))

      const weeks = parseExcelToWeeks(sheetsData)
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()

      // Colors
      const headerBlue: [number, number, number] = [0, 51, 102]
      const lightBlue: [number, number, number] = [200, 220, 240]
      const white: [number, number, number] = [255, 255, 255]
      const black: [number, number, number] = [0, 0, 0]
      const darkGray: [number, number, number] = [60, 60, 60]
      const borderColor: [number, number, number] = [0, 51, 102]

      // ===== PAGE 1: SUMMARY =====
      const margin = 12
      let y = margin

      // Title bar
      doc.setFillColor(...headerBlue)
      doc.rect(margin, y, pageW - margin * 2, 10, "F")
      doc.setTextColor(...white)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Reporte de Actividades", margin + 4, y + 7)
      y += 14

      // Info block
      const labelW = 45
      const valueW = 80
      const infoStartX = margin
      const infoData = [
        
        { label: "Nombre Consultor", value: name },
        { label: "Periodo", value: periodo },
        { label: "Mes", value: mes },
      ]

      for (const item of infoData) {
        doc.setFillColor(...lightBlue)
        doc.rect(infoStartX, y, labelW, 7, "F")
        doc.setDrawColor(...borderColor)
        doc.rect(infoStartX, y, labelW, 7, "S")
        doc.setTextColor(...black)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(item.label, infoStartX + 2, y + 5)

        doc.setFillColor(...white)
        doc.rect(infoStartX + labelW, y, valueW, 7, "F")
        doc.setDrawColor(...borderColor)
        doc.rect(infoStartX + labelW, y, valueW, 7, "S")
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...darkGray)
        doc.text(item.value, infoStartX + labelW + 2, y + 5)
        y += 7
      }

      y += 8

      // Summary table
      const summaryHeaders = ["Cliente", "Periodo", "Suma de Total"]
      const summaryColWidths = [60, 60, 50]
      const summaryStartX = margin

      // Header row
      doc.setFillColor(...headerBlue)
      let xPos = summaryStartX
      for (let i = 0; i < summaryHeaders.length; i++) {
        doc.rect(xPos, y, summaryColWidths[i], 8, "F")
        doc.setDrawColor(...borderColor)
        doc.rect(xPos, y, summaryColWidths[i], 8, "S")
        doc.setTextColor(...white)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(summaryHeaders[i], xPos + 2, y + 5.5)
        xPos += summaryColWidths[i]
      }
      y += 8

      // Client total row
      const totalHours = weeks.reduce((sum, w) => sum + w.grandTotal, 0)
      xPos = summaryStartX
      const clientRowData = [cliente, periodo, String(totalHours)]
      doc.setFillColor(...lightBlue)
      for (let i = 0; i < clientRowData.length; i++) {
        doc.rect(xPos, y, summaryColWidths[i], 7, "F")
        doc.setDrawColor(...borderColor)
        doc.rect(xPos, y, summaryColWidths[i], 7, "S")
        doc.setTextColor(...black)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)
        doc.text(clientRowData[i], xPos + 2, y + 5)
        xPos += summaryColWidths[i]
      }
      y += 7

      // Weekly breakdown
      for (const week of weeks) {
        xPos = summaryStartX
        const weekRowData = ["", week.weekLabel, String(week.grandTotal)]
        doc.setFillColor(...white)
        for (let i = 0; i < weekRowData.length; i++) {
          doc.rect(xPos, y, summaryColWidths[i], 7, "F")
          doc.setDrawColor(...borderColor)
          doc.rect(xPos, y, summaryColWidths[i], 7, "S")
          doc.setTextColor(...darkGray)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
          doc.text(weekRowData[i], xPos + (i === 0 ? 8 : 2), y + 5)
          xPos += summaryColWidths[i]
        }
        y += 7
      }

      y += 12

      // Elaboro / Autorizo section on summary
      const sigBlockW = 80
      // Elaboro
      doc.setFillColor(...lightBlue)
      doc.rect(margin, y, 30, 7, "F")
      doc.setDrawColor(...borderColor)
      doc.rect(margin, y, 30, 7, "S")
      doc.setTextColor(...black)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.text("Elaboro", margin + 2, y + 5)

      doc.setFillColor(...white)
      doc.rect(margin + 30, y, sigBlockW, 7, "F")
      doc.setDrawColor(...borderColor)
      doc.rect(margin + 30, y, sigBlockW, 7, "S")
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...darkGray)
      doc.text(name, margin + 32, y + 5)

      // Autorizo
      const authX = margin + 30 + sigBlockW + 10
      doc.setFillColor(...lightBlue)
      doc.rect(authX, y, 30, 7, "F")
      doc.setDrawColor(...borderColor)
      doc.rect(authX, y, 30, 7, "S")
      doc.setTextColor(...black)
      doc.setFont("helvetica", "bold")
      doc.text("Autorizo", authX + 2, y + 5)

      doc.setFillColor(...white)
      doc.rect(authX + 30, y, sigBlockW, 7, "F")
      doc.setDrawColor(...borderColor)
      doc.rect(authX + 30, y, sigBlockW, 7, "S")
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...darkGray)
      doc.text(autorizo, authX + 32, y + 5)

      y += 12

      // Signature on summary
      if (signaturePreview) {
        try {
          doc.addImage(signaturePreview, "PNG", margin, y, 40, 20)
          y += 22
          doc.setDrawColor(...black)
          doc.setLineWidth(0.3)
          doc.line(margin, y, margin + 60, y)
          y += 4
          doc.setTextColor(...darkGray)
          doc.setFontSize(8)
          doc.setFont("helvetica", "normal")
          doc.text(name, margin, y)
        } catch {
          // Ignore signature errors
        }
      }

      // ===== WEEKLY DETAIL PAGES =====
      for (const week of weeks) {
        doc.addPage("letter", "landscape")
        y = margin

        // Title bar
        doc.setFillColor(...headerBlue)
        doc.rect(margin, y, pageW - margin * 2, 10, "F")
        doc.setTextColor(...white)
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Reporte de Tiempos", margin + 4, y + 7)

        // Period/Year on right
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(periodo, pageW - margin - 4, y + 4, { align: "right" })
        doc.text(mes, pageW - margin - 4, y + 8, { align: "right" })
        y += 14

        // Info block: Periodo, Nombre Consultor, Semana, Cliente, Proyecto
        const detailInfo = [
          { label: "Periodo", value: periodo },
          { label: "Nombre Consultor", value: name },
          { label: "Semana", value: week.weekLabel },
          { label: "Cliente", value: cliente },
          { label: "Proyecto", value: proyecto },
        ]

        const col1X = margin
        const detailLabelW = 42
        const detailValueW = 90

        for (const item of detailInfo) {
          doc.setFillColor(...lightBlue)
          doc.rect(col1X, y, detailLabelW, 6, "F")
          doc.setDrawColor(...borderColor)
          doc.rect(col1X, y, detailLabelW, 6, "S")
          doc.setTextColor(...black)
          doc.setFontSize(7)
          doc.setFont("helvetica", "bold")
          doc.text(item.label, col1X + 2, y + 4)

          doc.setFillColor(...white)
          doc.rect(col1X + detailLabelW, y, detailValueW, 6, "F")
          doc.setDrawColor(...borderColor)
          doc.rect(col1X + detailLabelW, y, detailValueW, 6, "S")
          doc.setFont("helvetica", "normal")
          doc.setTextColor(...darkGray)
          doc.text(item.value, col1X + detailLabelW + 2, y + 4)
          y += 6
        }

        y += 4

        // Activity table
        const dayHeaders = ["D", "L", "M", "M", "J", "V", "S"]
        const tableHeaders = [
          "Cliente",
          "Proyecto",
          "Fase",
          "Num Ticket",
          "Tarea/Actividad",
          ...dayHeaders,
          "Total",
        ]

        const bodyRows = week.rows.map((r) => [
          r.cliente,
          r.proyecto,
          r.fase,
          r.numTicket,
          r.tarea,
          ...r.hours.map((h) => (h === 0 ? "" : String(h))),
          String(r.total),
        ])

        // Totals row
        const totalsRow = [
          "",
          "",
          "",
          "",
          "",
          ...week.totalPerDay.map((t) => (t === 0 ? "0" : String(t))),
          String(week.grandTotal),
        ]
        bodyRows.push(totalsRow)

        autoTable(doc, {
          head: [tableHeaders],
          body: bodyRows,
          startY: y,
          theme: "grid",
          styles: {
            fontSize: 6,
            cellPadding: 1.5,
            textColor: black,
            lineColor: borderColor,
            lineWidth: 0.2,
            valign: "middle",
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: headerBlue,
            textColor: white,
            fontStyle: "bold",
            fontSize: 6.5,
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 32 },
            2: { cellWidth: 24 },
            3: { cellWidth: 18 },
            4: { cellWidth: 80, halign: "left" },
            5: { cellWidth: 8, halign: "center" },
            6: { cellWidth: 8, halign: "center" },
            7: { cellWidth: 8, halign: "center" },
            8: { cellWidth: 8, halign: "center" },
            9: { cellWidth: 8, halign: "center" },
            10: { cellWidth: 8, halign: "center" },
            11: { cellWidth: 8, halign: "center" },
            12: { cellWidth: 12, halign: "center", fontStyle: "bold" },
          },
          didParseCell: (data) => {
            // Style the last row (totals)
            if (data.row.index === bodyRows.length - 1) {
              data.cell.styles.fillColor = lightBlue
              data.cell.styles.fontStyle = "bold"
              data.cell.styles.fontSize = 7
            }
          },
          margin: { left: margin, right: margin },
        })

        const tableEndY =
          (doc as unknown as { lastAutoTable: { finalY: number } })
            .lastAutoTable.finalY

        y = tableEndY + 8

        // Elaboro / Autorizo at bottom
        const bottomY = Math.max(y, pageH - 38)

        // Elaboro section with signature
        doc.setFillColor(...lightBlue)
        doc.rect(margin, bottomY, 25, 6, "F")
        doc.setDrawColor(...borderColor)
        doc.rect(margin, bottomY, 25, 6, "S")
        doc.setTextColor(...black)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("Elaboro", margin + 2, bottomY + 4)

        // Signature image
        if (signaturePreview) {
          try {
            doc.addImage(
              signaturePreview,
              "PNG",
              margin,
              bottomY + 8,
              35,
              15
            )
          } catch {
            // Ignore
          }
        }

        // Name under signature
        doc.setDrawColor(...black)
        doc.setLineWidth(0.3)
        doc.line(margin, bottomY + 25, margin + 55, bottomY + 25)
        doc.setTextColor(...darkGray)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.text(name, margin, bottomY + 29)

        // Autorizo section
        const authStartX = pageW / 2 + 20
        doc.setFillColor(...lightBlue)
        doc.rect(authStartX, bottomY, 25, 6, "F")
        doc.setDrawColor(...borderColor)
        doc.rect(authStartX, bottomY, 25, 6, "S")
        doc.setTextColor(...black)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("Autorizo", authStartX + 2, bottomY + 4)

        doc.setDrawColor(...black)
        doc.setLineWidth(0.3)
        doc.line(authStartX, bottomY + 25, authStartX + 55, bottomY + 25)
        doc.setTextColor(...darkGray)
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.text(autorizo, authStartX, bottomY + 29)
      }

      // Save
      const sanitizedName = name.replace(/\s+/g, "-")
      doc.save(
        `Reporte-Actividades-${mes}-${periodo}-${sanitizedName}.pdf`
      )*/
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
