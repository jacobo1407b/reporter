
import { CardBody, CardHeader, Chip, Divider, Card } from '@heroui/react'
import { UploadZone } from '../ui/upload-zone'
import { FileSpreadsheet } from 'lucide-react'


interface ExcelProps {
    excelFiles: File[]
    handleExcelChange: (files: File[]) => void
}
function Excel({ excelFiles, handleExcelChange }: ExcelProps) {
    return (
        <Card shadow="sm">
            <CardHeader className="flex items-center gap-3 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        Paso 3: Archivos Excel
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Sube los archivos con las hojas por semana (columnas: Cliente,
                        Proyecto, Fase, Num Ticket, Tarea, D, L, M, M, J, V, S, Total)
                    </p>
                </div>
                {excelFiles.length > 0 && (
                    <Chip size="sm" color="success" variant="flat" className="ml-auto">
                        {excelFiles.length}{" "}
                        {excelFiles.length === 1 ? "archivo" : "archivos"}
                    </Chip>
                )}
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4">
                <UploadZone
                    accept=".xlsx,.xls"
                    multiple
                    label="Archivos de datos"
                    description="Formatos aceptados: XLSX, XLS"
                    icon="excel"
                    files={excelFiles}
                    onFilesChange={handleExcelChange}
                />
            </CardBody>
        </Card>
    )
}

export default Excel