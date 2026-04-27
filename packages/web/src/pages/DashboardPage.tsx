import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { clearTokens, getUserEmail } from "../lib/auth";
import { ApplicationsResponse, JobApplication, ApplicationStatus, Portal } from "../types/api";
import { useColumnConfig } from "../hooks/useColumnConfig";
import { ColumnId } from "../types/columns";
import Dropdown from "../components/ui/Dropdown";
import SearchBar from "../components/ui/SearchBar";
import { LoaderCircle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

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
  const { columns } = useColumnConfig();
  const { theme, toggle } = useTheme();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [portalFilter, setPortalFilter] = useState<Portal | "">("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
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
    sortBy: "appliedAt",
    sortOrder,
    page,
    limit: 20,
  };

  const { data, isLoading } = useQuery<ApplicationsResponse>({
    queryKey: ["applications", params],
    queryFn: () => api.get("/applications", { params }).then((r) => r.data),
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

  const colLabel = (id: ColumnId) =>
    id === "title" ? "STANOWISKO" : id === "company" ? "FIRMA"
    : id === "status" ? "STATUS" : id === "portal" ? "PORTAL"
    : id === "salary" ? "WYNAGRODZENIE" : id === "contractType" ? "TYP UMOWY"
    : id === "location" ? "LOKALIZACJA" : id === "interviewAt" ? "ROZMOWA"
    : id === "appliedAt" ? "DATA" : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <header className="header">
        <span className="header__logo">Job Assistant Manager</span>
        <div className="header__right">
          <span className="header__email">{getUserEmail()}</span>
          <button
            onClick={toggle}
            title={theme === "persimmon" ? "Przełącz na Blueberry" : "Przełącz na Persimmon"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
          >
            {theme === "persimmon" ? "🫐" : "🍅"}
          </button>
          <button onClick={handleLogout} className="btn btn--ghost-cream btn--sm">Wyloguj</button>
        </div>
      </header>

      <main className="container main">
        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Dropdown
            label="Status"
            value={statusFilter}
            options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            onChange={(v) => { setStatusFilter(v as ApplicationStatus | ""); setPage(1); }}
          />
          <Dropdown
            label="Portal"
            value={portalFilter}
            options={ALL_PORTALS.map((p) => ({ value: p, label: PORTAL_LABELS[p] }))}
            onChange={(v) => { setPortalFilter(v as Portal | ""); setPage(1); }}
          />
          <Dropdown
            label="Sortuj"
            value={sortOrder}
            options={[
              { value: "desc", label: "Najnowsze" },
              { value: "asc", label: "Najstarsze" },
            ]}
            onChange={(v) => { setSortOrder(v as "desc" | "asc"); setPage(1); }}
          />
          <div style={{ marginLeft: "auto" }}>
            <SearchBar
              placeholder="Szukaj…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "0.5px solid var(--color-border)" }}>
          {isLoading && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(248, 242, 238, 0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LoaderCircle size={28} style={{ color: "var(--brick)", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-table-header)" }}>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    style={{
                      width: col.width, minWidth: col.width,
                      padding: "10px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
                      color: "var(--color-table-header-text)",
                    }}
                  >
                    {colLabel(col.id)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.applications.length === 0 ? (
                <tr><td colSpan={visibleColumns.length} style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)", background: "var(--color-table-row)" }}>Brak wyników</td></tr>
              ) : (
                data?.applications.map((app) => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: "0.5px solid var(--color-border)", background: "var(--color-table-row)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-row-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-table-row)")}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        style={{ width: col.width, minWidth: col.width, maxWidth: col.width, padding: "10px 16px", overflow: "hidden" }}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
            <span>Wyniki {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} z {pagination.total}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn--ghost btn--sm">Poprzednia</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn btn--ghost btn--sm">Następna</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
