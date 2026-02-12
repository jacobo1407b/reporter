"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Definimos el tipo de datos
export interface Registro {
  id: number; // siempre 1
  firma: Blob | null;
  nombreEmpleado: string;
  nombreCliente: string;
}

// Contexto
interface RegistroContextType {
  registro: Registro | null;
  agregar: (data: Omit<Registro, "id">) => Promise<void>;
  actualizar: (data: Partial<Omit<Registro, "id">>) => Promise<void>;
  eliminar: () => Promise<void>;
  consultar: () => Promise<Registro | null>;
}

const RegistroContext = createContext<RegistroContextType | undefined>(undefined);

// Función para abrir IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MiDB", 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("registros")) {
        db.createObjectStore("registros", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Provider
export const RegistroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registro, setRegistro] = useState<Registro | null>(null);

  useEffect(() => {
    consultar().then(setRegistro);
  }, []);

  const agregar = async (data: Omit<Registro, "id">) => {
    const db = await openDB();
    const tx:any = db.transaction("registros", "readwrite");
    const store = tx.objectStore("registros");
    const registro: Registro = { id: 1, ...data };
    store.put(registro);
    await tx.done;
    setRegistro(registro);
  };

  const actualizar = async (data: Partial<Omit<Registro, "id">>) => {
    const db = await openDB();
    const tx:any = db.transaction("registros", "readwrite");
    const store = tx.objectStore("registros");
    const current = (await consultar()) || { id: 1, firma: null, nombreEmpleado: "", nombreCliente: "" };
    const updated = { ...current, ...data };
    store.put(updated);
    await tx.done;
    setRegistro(updated);
  };

  const eliminar = async () => {
    const db = await openDB();
    const tx:any = db.transaction("registros", "readwrite");
    const store = tx.objectStore("registros");
    store.delete(1);
    await tx.done;
    setRegistro(null);
  };

  const consultar = async (): Promise<Registro | null> => {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction("registros", "readonly");
      const store = tx.objectStore("registros");
      const request = store.get(1);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  };

  return (
    <RegistroContext.Provider value={{ registro, agregar, actualizar, eliminar, consultar }}>
      {children}
    </RegistroContext.Provider>
  );
};

// Hook para consumir el contexto
export const useRegistro = () => {
  const ctx = useContext(RegistroContext);
  if (!ctx) throw new Error("useRegistro debe usarse dentro de RegistroProvider");
  return ctx;
};