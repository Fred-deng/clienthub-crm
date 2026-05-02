import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { employees } from "@/mock/data";
import type { Employee } from "@/types";

interface Ctx {
  current: Employee;
  setCurrent: (id: string) => void;
  all: Employee[];
}

const CurrentUserContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "jm.currentUserId";

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentId, setCurrentId] = useState<string>(() => {
    if (typeof window === "undefined") return employees[0].id;
    return localStorage.getItem(STORAGE_KEY) || employees[0].id;
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentId);
  }, [currentId]);
  const current = employees.find((e) => e.id === currentId) || employees[0];
  return (
    <CurrentUserContext.Provider value={{ current, setCurrent: setCurrentId, all: employees }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be inside CurrentUserProvider");
  return ctx;
}

/** 在非 React 上下文中（如 service 层）读取当前操作人姓名 */
export function readCurrentOperator(): string {
  try {
    const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return employees.find((e) => e.id === id)?.name || employees[0].name;
  } catch {
    return employees[0].name;
  }
}
