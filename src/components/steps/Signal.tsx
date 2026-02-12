import { useCallback, useEffect } from 'react';
import { CardBody, CardHeader, Divider, Card, Chip } from '@heroui/react'
import { PenTool } from 'lucide-react';
import { UploadZone } from "../ui/upload-zone";
import { useRegistro } from '../IndexDB';


interface SignalProps {
    setSignaturePreview: (preview: string | null) => void
    setSignatureFiles: (files: File[]) => void
    signatureFiles: File[]
    signaturePreview: string | null
    error: string | null
}
function Signal(props: SignalProps) {
    const { consultar } = useRegistro();

    useEffect(() => {
        consultar().then((data) => {
            const reader = new FileReader();
            const firma = data?.firma as File;
            const blobArray = firma ? [firma] : [];
            setSignatureFiles(blobArray);

            if (firma) {
                reader.onload = (e) => {
                    setSignaturePreview(e.target?.result as string)
                }
                reader.readAsDataURL(blobArray[0])
            }

        })
    }, [])

    const { setSignaturePreview, setSignatureFiles, signatureFiles, signaturePreview, error } = props

    const handleSignatureChange = useCallback((files: File[]) => {
        setSignatureFiles(files)
        //setError(null)
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
    return (
        <Card shadow="sm">
            <CardHeader className="flex items-center gap-3 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <PenTool className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        Paso 2: Firma
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Sube una imagen de tu firma
                    </p>
                </div>
                {signatureFiles.length > 0 && (
                    <Chip size="sm" color="success" variant="flat" className="ml-auto">
                        Completado
                    </Chip>
                )}
            </CardHeader>
            <Divider />
            <CardBody>
                <UploadZone
                    accept=".png,.jpg,.jpeg"
                    label="Firma digital"
                    description="Formatos aceptados: PNG, JPG (max 5MB)"
                    icon="image"
                    files={signatureFiles}
                    onFilesChange={handleSignatureChange}
                    preview={signaturePreview}
                />
            </CardBody>
        </Card>
    )
}

export default Signal