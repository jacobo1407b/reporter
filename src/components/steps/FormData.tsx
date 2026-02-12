import { useEffect } from "react";
import { DateRangePicker } from "@heroui/react";
import { CardBody, CardHeader, Divider, Input, Card, Chip } from '@heroui/react';
import { Building2, FileSpreadsheet, ShieldCheck, User } from 'lucide-react';
import { useRegistro } from "../IndexDB";


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

interface FormDataProps {
    formData: FormDataType;
    setformData: (formData: FormDataType) => void;
    isStep1Complete: boolean;
}
function FormData({ formData, setformData, isStep1Complete }: FormDataProps) {

    const { consultar } = useRegistro();
    useEffect(() => {
        consultar().then((data) => {
            setformData({
                ...formData,
                name: data?.nombreEmpleado ?? "",
                cliente: data?.nombreCliente ?? "",
            })
        })
    }, [])

    const onChange = (e: any) => {
        const { name, value } = e.target;
        setformData({ ...formData, [name]: value })
    }
    const dateOnchange = (e: any) => {
        const { start, end } = e
        const startDate = new Date(start.toString()).getTime();
        const endDate = new Date(end.toString()).getTime();
        setformData({ ...formData, periodo: { start: startDate, end: endDate } })
    }


    return (
        <Card shadow="sm">
            <CardHeader className="flex items-center gap-3 pb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-semibold text-foreground">
                        Paso 1: Datos del Proyecto
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Ingresa la informacion del consultor y proyecto
                    </p>
                </div>
                {isStep1Complete && (
                    <Chip size="sm" color="success" variant="flat" className="ml-auto">
                        Completado
                    </Chip>
                )}
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col gap-4" onChange={onChange}>
                <Input
                    aria-label='name'
                    label="Nombre del Consultor"
                    name='name'
                    placeholder="Ej: Jacobo Rodrigo Hernandez Mendieta"
                    value={formData.name}
                    onValueChange={(val) => {
                        setformData({ ...formData, name: val })
                    }}
                    variant="bordered"
                    size="lg"
                    startContent={
                        <User className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
                    }
                    isRequired
                    classNames={{
                        label: "text-foreground",
                        input: "text-foreground placeholder:text-muted-foreground",
                    }}
                />

                <div className="flex gap-4">
                    <DateRangePicker
                        aria-label='periodo'
                        className="max-w-xs"
                        label="Periodo"
                        onChange={dateOnchange}
                    />
                    {
                        /**
                         * 
                         * <Select
                        label="Mes"
                        placeholder="Selecciona un mes"
                        selectedKeys={mes ? [mes] : []}
                        onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string
                            setMes(selected || "")
                            setError(null)
                        }}
                        variant="bordered"
                        isRequired
                        classNames={{
                            label: "text-foreground",
                            value: "text-foreground",
                        }}
                    >
                        {MONTHS.map((m) => (
                            <SelectItem key={m}>{m}</SelectItem>
                        ))}
                    </Select>
                         */
                    }
                </div>

                <div className="flex gap-4">
                    <Input
                        aria-label='cliente'
                        label="Cliente"
                        name='cliente'
                        placeholder="Ej: Toks"
                        value={formData.cliente}
                        onValueChange={(val) => {
                            setformData({ ...formData, cliente: val })
                        }}
                        variant="bordered"
                        startContent={
                            <Building2 className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
                        }
                        isRequired
                        classNames={{
                            label: "text-foreground",
                            input: "text-foreground placeholder:text-muted-foreground",
                        }}
                    />

                    <Input
                        aria-label='proyecto'
                        name='proyecto'
                        label="Proyecto"
                        placeholder="Ej: Reingenieria Cadena de Suministro"
                        value={formData.proyecto}
                        onValueChange={(val) => {
                            setformData({ ...formData, proyecto: val })
                        }}
                        variant="bordered"
                        startContent={
                            <FileSpreadsheet className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
                        }
                        isRequired
                        classNames={{
                            label: "text-foreground",
                            input: "text-foreground placeholder:text-muted-foreground",
                        }}
                    />
                </div>

                <Input
                    label="Autorizo (Nombre)"
                    aria-label='autorizo'
                    name='autorizo'
                    placeholder="Ej: Jose Rojas Hernandez"
                    value={formData.autorizo}
                    onValueChange={(val) => {
                        setformData({ ...formData, autorizo: val })
                    }}
                    variant="bordered"
                    startContent={
                        <ShieldCheck className="pointer-events-none h-4 w-4 shrink-0 text-muted-foreground" />
                    }
                    isRequired
                    classNames={{
                        label: "text-foreground",
                        input: "text-foreground placeholder:text-muted-foreground",
                    }}
                />
            </CardBody>
        </Card>
    )
}

export default FormData