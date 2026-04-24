import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnConfig, ColumnId, LOCKED_COLUMNS } from "../types/columns";

const COLUMN_LABELS: Record<ColumnId, string> = {
  title: "Stanowisko",
  company: "Firma",
  status: "Status",
  portal: "Portal",
  salary: "Wynagrodzenie",
  contractType: "Typ umowy",
  location: "Lokalizacja",
  interviewAt: "Rozmowa",
  appliedAt: "Data aplikacji",
  actions: "Akcje",
};

function SortableRow({
  col,
  onChange,
}: {
  col: ColumnConfig;
  onChange: (updated: ColumnConfig) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: col.id });
  const locked = LOCKED_COLUMNS.includes(col.id as ColumnId);

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-b border-gray-100"
    >
      <td className="py-1.5 pr-2 w-6 text-gray-400 cursor-grab" {...attributes} {...listeners}>
        ⠿
      </td>
      <td className="py-1.5 pr-3 text-sm text-gray-700">{COLUMN_LABELS[col.id]}</td>
      <td className="py-1.5 pr-3">
        <input
          type="checkbox"
          checked={col.visible}
          disabled={locked}
          onChange={(e) => onChange({ ...col, visible: e.target.checked })}
          className="cursor-pointer disabled:cursor-not-allowed"
        />
      </td>
      <td className="py-1.5">
        <input
          type="number"
          min={40}
          max={800}
          value={col.width}
          onChange={(e) => onChange({ ...col, width: Math.max(40, Math.min(800, Number(e.target.value))) })}
          className="w-16 border border-gray-300 rounded px-1 py-0.5 text-xs"
        />
      </td>
    </tr>
  );
}

interface Props {
  columns: ColumnConfig[];
  setColumns: (updater: ColumnConfig[] | ((prev: ColumnConfig[]) => ColumnConfig[])) => void;
  resetColumns: () => void;
  onClose: () => void;
}

export default function ColumnConfigurator({ columns, setColumns, resetColumns, onClose }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumns((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id);
      const newIdx = prev.findIndex((c) => c.id === over.id);
      return arrayMove(prev, oldIdx, newIdx).map((c, i) => ({ ...c, order: i }));
    });
  }

  function handleChange(updated: ColumnConfig) {
    setColumns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <div className="absolute right-0 top-10 z-20 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Kolumny</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={columns.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-200">
                <th className="pb-1 w-6" />
                <th className="pb-1 text-left">Kolumna</th>
                <th className="pb-1">Widoczna</th>
                <th className="pb-1">Szer.</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <SortableRow key={col.id} col={col} onChange={handleChange} />
              ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>
      <button
        onClick={resetColumns}
        className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Resetuj do domyślnych
      </button>
    </div>
  );
}
