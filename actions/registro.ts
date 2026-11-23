'use server';

import { connectDB } from '../lib/mongodb';
import { Registro } from '../models/Registros';

function normalizarNombre(texto: string): string {
    return texto
        .normalize('NFD')                   // Separa las letras de sus acentos (ej: 'é' -> 'e' + '´')
        .replace(/[\u0300-\u036f]/g, '')    // Elimina los acentos y diéresis (conservará la 'ñ' si usas el ajuste de abajo)
        .toLowerCase()                      // Convierte todo a minúsculas
        .trim()                             // Quita espacios al inicio y al final
        .replace(/\s+/g, ' ');              // Convierte múltiples espacios internos en uno solo
}

export async function registrarOActualizar(nombre: string) {
    await connectDB();
    const nombreNormalizado = normalizarNombre(nombre);
    const registro = await Registro.findOneAndUpdate(
        { nombre: nombreNormalizado },
        {
            $inc: { counter: 1 },
            $set: { last_login: new Date() },
            $setOnInsert: { nombre: nombreNormalizado }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    ).lean();

    return registro
        ? {
            ...registro,
            _id: registro._id.toString(),
        }
        : null;
}
