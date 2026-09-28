import { number } from "framer-motion";
import * as XLSX from "xlsx";
type DataExcel = {
    fecha: number;
    semana: number;
    tiket: string;
    proyecto: string;
    description: string;
    horas: number;
    fase: string;
}
type DiaSemana = {
    dia: string;   // número de día
    mes: number;   // número de mes (1-12)
    letra: string; // letra del día (D, L, M, X, J, V, S)
};

type GroupExcel = {
    registros: DataExcel[];
    semana: number;
    total: number;
}

interface Actividad {
    fecha: number;
    semana: number;
    tiket: string;
    proyecto: string;
    description: string;
    horas: number;
    fase: string;
}
const normalize = (s: unknown) =>
    String(s ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
const COLUMN_ALIASES: Record<keyof Omit<DataExcel, "semana">, string[]> = {
    fecha: ["fecha", "date"],
    tiket: ["numero de ticket", "tiket"],
    description: ["descripcion de la tarea o actividad", "description"],
    horas: ["horas consumidas", "hours"],
    fase: ["fase", "phase"],
    proyecto: ["proyecto", "project"],
};

function getISOWeek(date: Date): number {
    const tmp = new Date(date.getTime());
    tmp.setHours(0, 0, 0, 0);

    // Ajustar al jueves de la semana actual
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));

    // Primer jueves del año
    const firstThursday = new Date(tmp.getFullYear(), 0, 4);

    // Calcular número de semana
    const week = 1 + Math.round(
        ((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7
    );

    return week;
}

export const handlerReaFiles = (files: File[], proyecto: string): Promise<DataExcel[]> => {

    return new Promise((resolve, reject) => {
        Promise.all(files.map((file) => ReadExcel(file, proyecto)))
            .then((results) => {
                const allData: DataExcel[] = results.flat();
                resolve(allData);
            })
            .catch(reject);
    })
}

const ReadExcel = (file: File, proyecto: string) => {

    return new Promise<DataExcel[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array", cellDates: true });

            workbook.SheetNames.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(
                    worksheet,
                    {
                        header: 1,
                    }
                );
                const headers = (jsonData[0] ?? []).map(normalize);

                const idx = {} as Record<keyof typeof COLUMN_ALIASES, number>;

                for (const key of Object.keys(COLUMN_ALIASES) as (keyof typeof COLUMN_ALIASES)[]) {

                    const i = headers.findIndex((h) => COLUMN_ALIASES[key].includes(normalize(h)));

                    if (i === -1) {
                        reject(new Error(`No se encontró la columna "${key}" en la hoja "${sheetName}"`));
                        return;
                    }
                    idx[key] = i;
                }

                const rows: DataExcel[] = jsonData
                    .slice(1)
                    .filter((row) => row[idx.fecha] != null)
                    .map((row) => {
                        const fecha = new Date(row[idx.fecha]);
                        return {
                            fecha: fecha.getTime(),
                            semana: getISOWeek(fecha),
                            tiket: row[idx.tiket] as string,
                            proyecto: row[idx.proyecto] as string,
                            description: row[idx.description] as string,
                            horas: row[idx.horas] as number,
                            fase: row[idx.fase] as string,
                        };
                    })
                    .filter((row) => row.proyecto === proyecto);
                resolve(rows);
            })

        }
        reader.readAsArrayBuffer(file)
    })

}


export async function getBase64ImageFromUrl(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

function generarFila(actividad: Actividad, cliente: string, proyect: string): any {
    const fecha = new Date(actividad.fecha);
    const diaSemana = fecha.getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab

    const dias = ["", "", "", "", "", "", ""]; // [D, L, M, M, J, V, S]

    dias[diaSemana] = actividad.horas.toString();

    return {
        dia: diaSemana,
        data: [
            cliente,        // Cliente
            proyect,
            actividad.fase,                             // Fase
            actividad.tiket,                            // Num Ticket
            actividad.description,                      // Tarea/Actividad
            ...dias,                                    // D, L, M, M, J, V, S
            actividad.horas                             // Total
        ]
    }
}
export function agruparPorSemana(data: DataExcel[], cliente: string) {
    const agrupado = data.reduce((acc, item) => {
        // Si no existe la semana en el acumulador, la inicializamos
        if (!acc[item.semana]) {
            acc[item.semana] = {
                semana: item.semana,
                registros: [],
                horasPorDia: Array(7).fill(0),
                total: 0
            };
        }
        ;
        // Agregamos el registro y sumamos las horas
        acc[item.semana].registros.push(generarFila(item, cliente, "Reingeniería Cadena de Suministro"));
        acc[item.semana].total += item.horas;
        const diaIndex = new Date(item.fecha).getDay(); // 0=domingo ... 6=sábado
        acc[item.semana].horasPorDia[diaIndex] += item.horas;

        return acc;
    }, {} as Record<number, { semana: number; registros: any; horasPorDia: Array<number>; total: number }>);



    return Object.values(agrupado).sort((a, b) => a.semana - b.semana).map((v) => {
        const reg = v.registros.sort((a: any, b: any) => a.dia - b.dia).map((r: any) => r.data)
        return {
            ...v,
            registros: reg
        }
    })

}



export function getWeekDatesSundayStart(year: number, weekNumber: number): DiaSemana[] {
    // Primer día del año
    const firstDay = new Date(year, 0, 1);
    const dayOfWeek = firstDay.getDay(); // 0=domingo
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(firstDay.getDate() - dayOfWeek);

    // Calcular inicio de la semana deseada
    const weekStart = new Date(firstSunday);
    weekStart.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);

    // Mapeo de letras de días
    const dayLetters = ["D", "L", "M", "M", "J", "V", "S"];

    // Generar los 7 días
    const days: DiaSemana[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        days.push({
            dia: String(d.getDate()).padStart(2, "0"),
            mes: d.getMonth() + 1,
            letra: dayLetters[d.getDay()]
        });
    }
    days.push({
        dia: "",
        mes: weekStart.getMonth() + 1,
        letra: "Total"
    });
    return days;
}


export function generarTabla(listDays: DiaSemana[], body: { semana: number; registros: Array<Array<string>>; horasPorDia: number[]; total: number }, employe: string, aprove: string): HTMLTableElement {
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";
    table.style.width = "100%";


    // --- THEAD ---
    const thead = document.createElement("thead");

    // Primera fila: título
    const rowTitulo = document.createElement("tr");
    const tdTitulo = document.createElement("td");

    tdTitulo.textContent = "Reporte de Tiempos";
    tdTitulo.style.border = "1px solid black";
    tdTitulo.style.backgroundColor = "#215C98";
    tdTitulo.colSpan = 5;
    tdTitulo.style.color = "#fff";
    tdTitulo.style.fontWeight = "bold";
    tdTitulo.style.textAlign = "center";
    //tdTitulo.style.padding = "6px";
    tdTitulo.style.fontFamily = "Calibri";
    tdTitulo.style.fontSize = "9px";
    tdTitulo.style.width = "90%";


    rowTitulo.appendChild(tdTitulo);

    listDays.forEach((dia) => {
        const td = document.createElement("td");
        td.textContent = dia.dia;
        td.style.borderLeft = "1px solid black";
        td.style.backgroundColor = "#174a7d";

        td.style.color = "#fff";
        td.style.fontWeight = "bold";
        td.style.textAlign = "center";
        td.style.fontFamily = "Calibri";
        td.style.fontSize = "9px";
        td.style.padding = "0px";
        rowTitulo.appendChild(td);
    });
    thead.appendChild(rowTitulo);


    // Segunda fila: encabezados
    const rowHeader = document.createElement("tr");
    const headers = [
        "Cliente",
        "Proyecto",
        "Fase",
        "Num Ticket",
        "Tarea/Actividad",
        ...listDays.map((x) => x.letra)
    ];
    headers.forEach((h) => {
        const th = document.createElement("td");
        th.textContent = h;
        th.style.backgroundColor = "#215C98";
        th.style.color = "#fff";
        th.style.fontWeight = "bold";
        th.style.textAlign = "center";
        th.style.padding = "4px";
        th.style.fontFamily = "Calibri";
        th.style.width = h.length > 10 ? "120px" : "40px"; // ejemplo de control de ancho
        rowHeader.appendChild(th);
    });
    thead.appendChild(rowHeader);
    table.appendChild(thead);

    // --- TBODY ---
    const tbody = document.createElement("tbody");

    // Una sola fila de datos (hardcodeada)
    body.registros.forEach((bf) => {
        const row = document.createElement("tr");
        bf.forEach((d) => {
            const td = document.createElement("td");
            td.textContent = d;
            td.style.textAlign = "center";
            td.style.padding = "4px";
            td.style.fontFamily = "Calibri";
            td.style.fontSize = "10px";
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    // --- TFOOT ---
    const tfoot = document.createElement("tfoot");
    const rowFooter = document.createElement("tr");
    // Celda del footer


    // Finalmente agregamos el footer a la tabla
    const fother = [
        "",
        "",
        "",
        "",
        "Total",
        ...body.horasPorDia,
        body.total
    ];
    fother.forEach((v, i) => {
        const tdFooter = document.createElement("td");
        tdFooter.textContent = v !== 0 ? v.toString() : "";
        tdFooter.style.fontFamily = "Calibri";
        rowFooter.appendChild(tdFooter);
    });
    tfoot.appendChild(rowFooter);
    const signature = document.createElement("tr");
    const tdSignature = document.createElement("td");
    tdSignature.colSpan = 5;
    tdSignature.textContent = ".";
    signature.appendChild(tdSignature);
    tfoot.appendChild(signature);


    const ft = [{ sp: ".", text: "Elaboró", emp: employe }, { sp: ".", text: "Autorizó", emp: aprove }];

    ft.forEach((v) => {
        const otro = document.createElement("tr");
        Object.keys(v).forEach((key: string) => {
            const k = key as keyof typeof v;
            const tdFooter = document.createElement("td");
            if (key === "sp") tdFooter.colSpan = 3;
            tdFooter.textContent = v[k];
            otro.appendChild(tdFooter);
        });

        tfoot.appendChild(otro);
    })

    table.appendChild(tfoot);

    return table;
}
