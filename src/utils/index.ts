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
                const rows: DataExcel[] = jsonData
                    .slice(1)
                    .map((row) => {
                        const semana = getISOWeek(new Date(row[0]));
                        return {
                            fecha: new Date(row[0]).getTime(),
                            semana: semana,
                            tiket: row[1] as string,
                            proyecto: row[2] as string,
                            description: row[3] as string,
                            horas: row[5] as number,
                            fase: row[6] as string
                        }
                    }).filter((row) => row.proyecto === proyecto);
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

export function agruparPorSemana(data: DataExcel[]) {
    const agrupado = data.reduce((acc, item) => {
        // Si no existe la semana en el acumulador, la inicializamos
        if (!acc[item.semana]) {
            acc[item.semana] = {
                semana: item.semana,
                registros: [],
                total: 0
            };
        }

        // Agregamos el registro y sumamos las horas
        acc[item.semana].registros.push(item);
        acc[item.semana].total += item.horas;

        return acc;
    }, {} as Record<number, { semana: number; registros: DataExcel[]; total: number }>);

    // Convertimos el objeto en array para recorrerlo más fácil
    return Object.values(agrupado).sort((a, b) => a.semana - b.semana);

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


export function generarTabla(): HTMLTableElement {
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
    
    const dias = ["30", "01", "02", "03", "04", "05", "06", ""];
    dias.forEach((dia, idx) => {
        const td = document.createElement("td");
        td.textContent = dia;
        td.style.borderLeft = "1px solid black";
        td.style.backgroundColor = "#215C98";
        
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
        "D",
        "L",
        "M",
        "M",
        "J",
        "V",
        "S",
        "Total"
    ];
    headers.forEach((h, idx) => {
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
    /*const tbody = document.createElement("tbody");

    // Una sola fila de datos (hardcodeada)
    const row = document.createElement("tr");
    const datos = [
        "Toks",
        "Reingeniería Cadena de Suministro",
        "Desarrollo",
        "#001731",
        "Ajuste y análisis integración 011 para bajar la categoría de artículo e insertar en la tabla de pedidos",
        "8",
        "8",
        "8",
        "24"
    ];
    datos.forEach((d) => {
        const td = document.createElement("td");
        td.textContent = d;
        td.style.textAlign = "center";
        td.style.padding = "4px";
        td.style.fontFamily = "Calibri";
        td.style.fontSize = "10px";
        row.appendChild(td);
    });
    tbody.appendChild(row);
    table.appendChild(tbody);*/

    return table;
}
