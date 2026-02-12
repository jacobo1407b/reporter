import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ITG from "@/assets/itg.jpg";
import esr from "@/assets/esr.png";
import gr from "@/assets/gr.png";
import partnet from "@/assets/partner.png";
import { getBase64ImageFromUrl, agruparPorSemana } from "@/utils";
import { getWeekDatesSundayStart, generarTabla } from "@/utils";
type DataExcel = {
    fecha: number;
    semana: number;
    tiket: string;
    proyecto: string;
    description: string;
    horas: number;
    fase: string;
}
type GroupExcel = {
    registros: DataExcel[];
    semana: number;
    total: number;
}

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];


export const dataToPdf = async (data: DataExcel[], autorize: string, employe: string, signaturePreview: string, client: string) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
    const anio = new Date(data[0].fecha).getFullYear();
    const month = meses[new Date(data[0].fecha).getMonth()];

    const groupedData: GroupExcel[] = agruparPorSemana(data);
    const listDays = getWeekDatesSundayStart(anio, data[1].semana);


    // Colors
    const headerBlue: [number, number, number] = [33, 92, 152];
    const lightBlue: [number, number, number] = [33, 92, 152]
    const white: [number, number, number] = [255, 255, 255]
    const black: [number, number, number] = [0, 0, 0]
    const darkGray: [number, number, number] = [33, 92, 152]
    const borderColor: [number, number, number] = [0, 51, 102]

    // ===== PAGE 1: SUMMARY =====
    const margin = 20
    let y = margin

    // Info block
    const labelW = 32
    const valueW = 80
    const infoStartX = margin + 45
    const infoData = [
        { label: "Nombre Consultor", value: employe },
        { label: "Periodo", value: anio.toString() },
        { label: "Mes", value: month.toString() },
    ];
    doc.addImage(await getBase64ImageFromUrl(ITG.src), "JPG", 34, margin + 1, 24, 14)
    for (const item of infoData) {
        doc.setFillColor(...lightBlue)
        doc.rect(infoStartX, y, labelW, 5, "F")
        doc.setDrawColor(...lightBlue)
        doc.rect(infoStartX, y, labelW, 5, "S")
        doc.setTextColor(...white)
        doc.setFontSize(10)
        doc.setFont("calibri", "bold");
        doc.text(item.label, infoStartX + 1, y + 4)

        doc.setFillColor(...white)
        doc.rect(infoStartX + labelW, y, valueW, 5, "F")
        doc.setDrawColor(...white)
        doc.rect(infoStartX + labelW, y, valueW, 5, "S")
        doc.setFont("calibri", "normal")
        doc.setTextColor(...darkGray)
        doc.setFontSize(10)
        doc.text(item.value, infoStartX + labelW + 1, y + 4)
        y += 5
    }

    y += 8
    doc.addImage(await getBase64ImageFromUrl(esr.src), "PNG", 180, margin + 1, 27, 17)
    doc.addImage(await getBase64ImageFromUrl(gr.src), "PNG", 210, margin + 1, 10, 17)

    // Summary table
    const summaryStartX = margin + 15
    doc.addImage(await getBase64ImageFromUrl(partnet.src), "PNG", 21, summaryStartX, 45, 13)
    const headerClient = ["Cliente", client];


    // Header row
    //doc.setFillColor(...[255, 255, 255])
    const weekBody = [["", ""]]
    let startY = margin + 19; // ajusta según la altura del logo
    const startX = 70;         // coordenada X donde quieres la tabla

    autoTable(doc, {
        head: [headerClient],
        tableWidth: 60,
        body: weekBody,
        startY: startY,
        margin: { left: startX },
        styles: { font: "aptosnarro", fontSize: 10, textColor: [50, 50, 50], fillColor: [255, 255, 255] },
        headStyles: {
            fillColor: [192, 230, 245],
            textColor: [0, 0, 0],
            font: "aptosnarro",
            minCellHeight: 1,
            fontStyle: "normal",
            fontSize: 10,
            lineColor: [68, 179, 225], // color del borde
            lineWidth: { bottom: 1 }
        },
        bodyStyles: {
            fillColor: [255, 255, 255],
            font: "aptosnarro",
            minCellHeight: 3
        },
        columnStyles: {
            0: { cellWidth: 35, halign: "left" },   // primera columna alineada a la izquierda
            1: { cellWidth: 25, halign: "right" }    // segunda columna alineada a la derecha
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }
    });
    const totalMes = data.reduce((sum, item) => sum + item.horas, 0);
    startY += 15; // ajusta según el espacio que quieras entre la tabla y el resumen
    autoTable(doc, {
        head: [["Periodo", "Suma de Total"]],
        body: [[anio, totalMes]],
        tableWidth: 60,
        startY: startY,
        margin: { left: startX },
        headStyles: {
            fillColor: [192, 230, 245],
            textColor: [0, 0, 0],
            font: "aptosnarro",
            minCellHeight: 1,
            fontStyle: "bold",
            fontSize: 10,
            lineColor: [68, 179, 225], // color del borde
            lineWidth: { bottom: 1 },
        },
        styles: {
            font: "aptosnarro",
            fontStyle: "bold",
            fontSize: 10,
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255],
            lineColor: [68, 179, 225], // color del borde
            lineWidth: { bottom: 0.3 }
        },
        columnStyles: {
            0: { cellWidth: 35, halign: "left" },   // primera columna alineada a la izquierda
            1: { cellWidth: 25, halign: "right" }    // segunda columna alineada a la derecha
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }

    });
    startY += 17;
    autoTable(doc, {
        head: [[month, totalMes]],
        foot: [["", totalMes]],
        tableWidth: 55,
        startY: startY,
        margin: { left: startX + 5 },
        body: groupedData.map((item) => [`Semana ${item.semana}`, item.total]),
        footStyles: {
            fillColor: [192, 230, 245], // fondo gris claro
            textColor: [0, 0, 0],   // texto azul corporativo
            fontStyle: "bold",          // negrita
            halign: "right",             // alineación a la derecha
            fontSize: 10,
            lineWidth: { top: 0.5 },
            lineColor: [68, 179, 225]
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "aptosnarro",
            minCellHeight: 1,
            fontStyle: "bold",
            fontSize: 10,
            //lineColor: [68, 179, 225], // color del borde
            //lineWidth: { bottom: 1 }
        },
        didParseCell: (data) => {
            if (data.section === "head" && data.column.index === 1) {
                data.cell.styles.halign = "right";
            }
        },
        styles: {
            font: "aptosnarro",
            fontStyle: "normal",
            fontSize: 10,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 40, halign: "center" },   // primera columna alineada a la izquierda
            1: { cellWidth: 15, halign: "right" }    // segunda columna alineada a la derecha
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }
    });
    doc.addImage(signaturePreview, "JPG", startX + 100, startY - 15, 17, 13)

    autoTable(doc, {
        head: [["Elaboró", employe]],
        tableWidth: 80,
        startY: startY,
        margin: { left: startX + 80 },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "aptosnarro",
            minCellHeight: 1,
            fontSize: 10
        },
        body: [[]],
        didParseCell: (data) => {
            if (data.section === "head") {
                if (data.column.index === 0) {
                    // Primera celda ("Elaboró") → Bold
                    data.cell.styles.fontStyle = "bold";
                }
                if (data.column.index === 1) {
                    // Segunda celda (employe) → Normal
                    data.cell.styles.fontStyle = "normal";
                    data.cell.styles.lineColor = [0, 0, 0];
                    data.cell.styles.lineWidth = { bottom: 0.5 };
                }
            }
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }
    });

    startY += 37;
    autoTable(doc, {
        head: [["Autorizó", autorize]],
        tableWidth: 60,
        startY: startY,
        margin: { left: startX + 80 },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: "aptosnarro",
            minCellHeight: 1,
            fontSize: 10
        },
        body: [[]],
        didParseCell: (data) => {
            if (data.section === "head") {
                if (data.column.index === 0) {
                    // Primera celda ("Elaboró") → Bold
                    data.cell.styles.fontStyle = "bold";
                }
                if (data.column.index === 1) {
                    // Segunda celda (employe) → Normal
                    data.cell.styles.fontStyle = "normal";
                    data.cell.styles.lineColor = [0, 0, 0];
                    data.cell.styles.lineWidth = { bottom: 0.5 };
                }
            }
        },
        alternateRowStyles: { fillColor: [255, 255, 255] }
    });

    doc.addPage();
    let ejex = 19;
    let ejey = 13;
    doc.addImage(await getBase64ImageFromUrl(ITG.src), "JPG", ejex, ejey, 25.5, 14.2)
    doc.addImage(await getBase64ImageFromUrl(partnet.src), "PNG", ejex - 9, ejey + 12, 41, 13.3)

    ejex += 36;
    ejey -= 8;
    autoTable(doc, {
        head: [["", ""]],
        tableWidth: 120,
        headStyles: {
            fillColor: [255, 255, 255],   // Fondo blanco
        },
        bodyStyles: {
            font: "calibri",
            fontSize: 10,
            cellPadding: 0.5
        },

        startY: ejey,
        margin: { left: ejex },
        body: [["Periodo", anio], ["Nombre Consultor", employe], ["Semana", "Semana 49"], ["Cliente", client], ["Proyecto", "Proyecto X"]],
        columnStyles: {
            0: { fillColor: [33, 92, 152], textColor: [255, 255, 255], minCellHeight: 5 }, // Primera columna
            1: { fillColor: [255, 255, 255], textColor: [33, 92, 152] }  // Segunda columna
        }

    });
    doc.addImage(await getBase64ImageFromUrl(esr.src), "PNG", ejex + 165, ejey + 10, 27, 17);
    doc.addImage(await getBase64ImageFromUrl(gr.src), "PNG", ejex + 194, ejey + 10, 10, 17);

    ejey += 30;
    ejex += 180;

    doc.setTextColor(...[33, 92, 152])
    doc.setFontSize(10)
    doc.setFont("calibri", "bold");
    doc.text(month, ejex, ejey);

    ejey += 2;
    ejex -= 225;
    const headerMes = listDays.map((d) => [d.dia]);
    headerMes.unshift(["Reporte de Tiempos"])


    const tabla = generarTabla();
    autoTable(doc, {
        html: tabla,
        styles: {
            lineColor: [0, 0, 0],   // color de línea (negro)
            lineWidth: 0.2,         // grosor de la línea
            halign: "center",
            valign: "middle",
        },
    });

    /*autoTable(doc, {
        head: [headerMes],
        headStyles: {
            font: "calibri",
            fillColor: [33, 92, 152],
            textColor: [255, 255, 255],
            halign: "center",
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: { right: 0, left: 0 },
            lineWidth: 0.2,
            lineColor: [0, 0, 0]
        } as any,
        columnStyles: {
            0: { cellWidth: 246, minCellWidth: 246 },  // Columna "Reporte de Tiempos" más ancha
            1: { cellWidth: 1, minCellWidth: 1 },
            2: { cellWidth: 1, minCellWidth: 1 },
            3: { cellWidth: 1, minCellWidth: 1 },
            4: { cellWidth: 1, minCellWidth: 1 },
            5: { cellWidth: 1, minCellWidth: 1 },
            6: { cellWidth: 1, minCellWidth: 1 },
            7: { cellWidth: 1, minCellWidth: 1 }
        },
        startY: ejey,
        margin: { left: ejex }
    })*/

    doc.save("reporte_consultoria.pdf");

}