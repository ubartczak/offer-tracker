import { useState, useEffect } from "react";
import { z } from "zod";
import { ColumnConfig, ColumnId, DEFAULT_COLUMNS, LOCKED_COLUMNS } from "../types/columns";

const STORAGE_KEY = "offer-tracker:columns";

const columnConfigSchema = z.array(z.object({
  id: z.enum(["title", "company", "status", "portal", "salary",
              "contractType", "location", "interviewAt",
              "appliedAt", "actions"]),
  visible: z.boolean(),
  order: z.number().int().min(0).max(99),
  width: z.number().int().min(40).max(800),
})).max(20);

function loadFromStorage(): ColumnConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = columnConfigSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return DEFAULT_COLUMNS;
    // Ensure all default columns are present (handle schema additions)
    const stored = parsed.data as ColumnConfig[];
    const storedIds = new Set(stored.map((c) => c.id));
    const missing = DEFAULT_COLUMNS.filter((c) => !storedIds.has(c.id));
    return [...stored, ...missing];
  } catch {
    return DEFAULT_COLUMNS;
  }
}

export function useColumnConfig() {
  const [columns, setColumnsState] = useState<ColumnConfig[]>(() =>
    loadFromStorage().sort((a, b) => a.order - b.order)
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  function setColumns(updater: ColumnConfig[] | ((prev: ColumnConfig[]) => ColumnConfig[])) {
    setColumnsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      // Enforce locked columns are always visible
      return next.map((c) =>
        LOCKED_COLUMNS.includes(c.id as ColumnId) ? { ...c, visible: true } : c
      );
    });
  }

  function resetColumns() {
    setColumnsState([...DEFAULT_COLUMNS]);
  }

  return {
    columns: columns.sort((a, b) => a.order - b.order),
    setColumns,
    resetColumns,
  };
}
