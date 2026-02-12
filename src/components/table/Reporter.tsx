import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReporteProps = {
    proyecto: string;
    horas: string[];
};

export function TablaReporte({ proyecto, horas }: ReporteProps) {
    return (
        <table
            style={{ display: "none" }}
            ref={null} // el ref lo asignaremos desde el padre
        >
            <thead>
                <tr>
                    <td colSpan={horas.length + 1}>Reporte de Tiempos</td>
                </tr>
                <tr>
                    <td>Diciembre</td>
                    {horas.map((_, i) => (
                        <td key={i}>{String(i + 7).padStart(2, "0")}</td>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{proyecto}</td>
                    {horas.map((h, i) => (
                        <td key={i}>{h}</td>
                    ))}
                </tr>
            </tbody>
        </table>
    );
}
