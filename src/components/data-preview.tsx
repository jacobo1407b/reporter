"use client"

import { Card, CardBody, CardHeader } from "@heroui/react"
import { Chip } from "@heroui/react"
import { FileSpreadsheet } from "lucide-react"

export interface SheetData {
  fileName: string
  sheetName: string
  headers: string[]
  rows: (string | number)[][]
  totalRows: number
}

interface DataPreviewProps {
  sheets: SheetData[]
}

export function DataPreview({ sheets }: DataPreviewProps) {
  if (sheets.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Vista Previa de Datos Extraidos
        </h3>
        <Chip size="sm" color="primary" variant="flat">
          {sheets.length} {sheets.length === 1 ? "hoja" : "hojas"}
        </Chip>
      </div>

      {sheets.map((sheet, idx) => (
        <Card key={`${sheet.fileName}-${sheet.sheetName}-${idx}`} shadow="sm">
          <CardHeader className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {sheet.fileName}
              </span>
              <Chip size="sm" variant="bordered" color="default">
                {sheet.sheetName}
              </Chip>
            </div>
            <span className="text-xs text-muted-foreground">
              {sheet.totalRows} filas totales
            </span>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary">
                    {sheet.headers.map((header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-foreground"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.slice(0, 5).map((row, rowIdx) => (
                    <tr
                      key={`row-${rowIdx}`}
                      className="border-t border-border transition-colors hover:bg-muted/50"
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={`cell-${rowIdx}-${cellIdx}`}
                          className="whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground"
                        >
                          {String(cell ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.totalRows > 5 && (
                <div className="border-t border-border bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
                  ... y {sheet.totalRows - 5} filas mas
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
