import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { clearTokens, getUserEmail } from "../lib/auth";
import { ApplicationsResponse, StatsResponse, JobApplication, ApplicationStatus, Portal } from "../types/api";
import { useColumnConfig } from "../hooks/useColumnConfig";
import ColumnConfigurator from "../components/ColumnConfigurator";
import { ColumnId } from "../types/columns";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Zapisana", APPLIED: "Aplikowano", INTERVIEW: "Rozmowa",
  OFFER: "Oferta", REJECTED: "Odrzucono", IGNORED: "Ghosted",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "bg-gray-100 text-gray-600",
  APPLIED: "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-yellow-100 text-yellow-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  IGNORED: "bg-gray-200 text-gray-500",
};

const PORTAL_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn", JUSTJOIN: "JustJoin", PRACUJ: "Pracuj.pl", OTHER: "Inne",
};

const PORTAL_COLORS: Record<string, string> = {
  LINKEDIN: "bg-blue-50 text-blue-800",
  JUSTJOIN: "bg-purple-50 text-purple-800",
  PRACUJ: "bg-orange-50 text-orange-800",
  OTHER: "bg-gray-100 text-gray-600",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatSalary(app: JobApplication) {
  if (!app.salaryMin && !app.salaryMax) return "—";
  const min = app.salaryMin?.toLocaleString("pl-PL") ?? "";
  const max = app.salaryMax?.toLocaleString("pl-PL") ?? "";
  const range = min === max || !max ? min : `${min}–${max}`;
  const suffix = app.salaryType === "HOURLY" ? "/h" : "/mies.";
  return `${range} ${app.currency ?? "PLN"}${suffix}`;
}

const ALL_STATUSES: ApplicationStatus[] = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED", "IGNORED", "SAVED"];
const ALL_PORTALS: Portal[] = ["LINKEDIN", "JUSTJOIN", "PRACUJ", "OTHER"];

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { columns, setColumns, resetColumns } = useColumnConfig();
  const [showConfigurator, setShowConfigurator] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [portalFilter, setPortalFilter] = useState<Portal | "">("");
  const [page, setPage] = useState(1);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 300);
  }

  const params = {
    ...(statusFilter && { status: statusFilter }),
    ...(portalFilter && { portal: portalFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    limit: 20,
  };

  const { data, isLoading } = useQuery<ApplicationsResponse>({
    queryKey: ["applications", params],
    queryFn: () => api.get("/applications", { params }).then((r) => r.data),
  });

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => api.get("/applications/stats").then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.patch(`/applications/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  async function handleLogout() {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    clearTokens();
    navigate("/login");
  }

  function handleDelete(app: JobApplication) {
    if (confirm(`Usunąć aplikację „${app.title}" w „${app.company}"?`)) {
      deleteMut.mutate(app.id);
    }
  }

  const visibleColumns = columns.filter((c) => c.visible);
  const pagination = data?.pagination;

  function renderCell(colId: ColumnId, app: JobApplication) {
    switch (colId) {
      case "title":
        return <a href={app.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium truncate block">{app.title}</a>;
      case "company":
        return <span className="truncate block">{app.company}</span>;
      case "status":
        return (
          <select
            value={app.status}
            onChange={(e) => statusMut.mutate({ id: app.id, status: e.target.value as ApplicationStatus })}
            className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ${STATUS_COLORS[app.status]}`}
          >
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        );
      case "portal":
        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PORTAL_COLORS[app.portal]}`}>{PORTAL_LABELS[app.portal]}</span>;
      case "salary":
        return <span className="text-sm tabular-nums">{formatSalary(app)}</span>;
      case "contractType":
        return <span>{app.contractType ?? "—"}</span>;
      case "location":
        return <span className="truncate block">{app.location ?? "—"}</span>;
      case "interviewAt":
        return <span>{formatDate(app.interviewAt)}</span>;
      case "appliedAt":
        return <span>{formatDate(app.appliedAt)}</span>;
      case "actions":
        return (
          <button
            onClick={() => handleDelete(app)}
            className="text-xs text-red-500 hover:text-red-700 hover:underline"
          >
            Usuń
          </button>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-lg">Offer Tracker</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{getUserEmail()}</span>
          <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">Wyloguj</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Wszystkie", value: stats.total },
              { label: "Aplikowano", value: stats.byStatus.APPLIED ?? 0 },
              { label: "Rozmowa", value: stats.byStatus.INTERVIEW ?? 0 },
              { label: "Oferta", value: stats.byStatus.OFFER ?? 0 },
              { label: "Odrzucono", value: stats.byStatus.REJECTED ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters + columns button */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="search" placeholder="Szukaj po stanowisku lub firmie…"
            value={search} onChange={(e) => handleSearchChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ApplicationStatus | ""); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Wszystkie statusy</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select
            value={portalFilter}
            onChange={(e) => { setPortalFilter(e.target.value as Portal | ""); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Wszystkie portale</option>
            {ALL_PORTALS.map((p) => <option key={p} value={p}>{PORTAL_LABELS[p]}</option>)}
          </select>

          <div className="relative ml-auto">
            <button
              onClick={() => setShowConfigurator((v) => !v)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:bg-gray-50"
            >
              Kolumny
            </button>
            {showConfigurator && (
              <ColumnConfigurator
                columns={columns}
                setColumns={setColumns}
                resetColumns={resetColumns}
                onClose={() => setShowConfigurator(false)}
              />
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 font-medium">
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: col.width, minWidth: col.width }}
                    className="text-left px-4 py-3"
                  >
                    {col.id === "title" ? "Stanowisko"
                      : col.id === "company" ? "Firma"
                      : col.id === "status" ? "Status"
                      : col.id === "portal" ? "Portal"
                      : col.id === "salary" ? "Wynagrodzenie"
                      : col.id === "contractType" ? "Typ umowy"
                      : col.id === "location" ? "Lokalizacja"
                      : col.id === "interviewAt" ? "Rozmowa"
                      : col.id === "appliedAt" ? "Data aplikacji"
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={visibleColumns.length} className="text-center py-12 text-gray-400">Ładowanie…</td></tr>
              ) : data?.applications.length === 0 ? (
                <tr><td colSpan={visibleColumns.length} className="text-center py-12 text-gray-400">Brak wyników</td></tr>
              ) : (
                data?.applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                        className="px-4 py-3 overflow-hidden"
                      >
                        {renderCell(col.id, app)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Wyniki {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} z {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Poprzednia
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Następna
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
