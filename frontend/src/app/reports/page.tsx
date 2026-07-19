"use client";

import { useEffect, useState } from "react";
import { BarChart3, Plus, Trash2, Calendar, TrendingUp } from "lucide-react";
import { getReports, generateReport, deleteReport } from "@/lib/api";
import { Report } from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/Skeleton";
import { formatDate, formatRelative } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

function ReportCard({ report, onDelete, onSelect }: {
  report: Report;
  onDelete: (id: string) => void;
  onSelect: (r: Report) => void;
}) {
  const typeColors = { daily: "#6366f1", weekly: "#10b981", monthly: "#f59e0b" };
  const color = typeColors[report.type] || "#6366f1";

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 hover:border-border/80 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20"
      onClick={() => onSelect(report)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
            <BarChart3 className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${color}18`, color }}>
            {report.type}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">{report.title}</h3>

      {report.summary && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{report.summary.split("\n")[0]}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {formatDate(report.period_start)} — {formatDate(report.period_end)}
        </span>
        <span className="text-xs text-muted-foreground">{formatRelative(report.created_at)}</span>
      </div>
    </div>
  );
}

function ReportDetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">{report.title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Summary */}
          {report.summary && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Summary</h3>
              <div className="space-y-1">
                {report.summary.split("\n").map((line, i) => (
                  <p key={i} className="text-sm text-foreground">{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Type breakdown */}
          {report.data?.type_breakdown && report.data.type_breakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">By Type</h3>
              <div className="space-y-2">
                {report.data.type_breakdown.map((item) => {
                  const pct = report.data!.activity_count > 0
                    ? Math.round((item.count / report.data!.activity_count) * 100)
                    : 0;
                  return (
                    <div key={item.type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground capitalize">{item.type.replace("_", " ")}</span>
                        <span className="text-foreground font-medium tabular-nums">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top projects */}
          {report.data?.top_projects && report.data.top_projects.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Top Projects</h3>
              <div className="space-y-2">
                {report.data.top_projects.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                      <span className="text-sm text-foreground">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{p.count} activities</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activities */}
          {report.data?.activities && report.data.activities.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Activities</h3>
              <div className="space-y-1.5">
                {report.data.activities.slice(0, 20).map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                      {a.occurred_at.slice(0, 10)}
                    </span>
                    <span className="text-muted-foreground shrink-0 capitalize">[{a.type.replace("_", " ")}]</span>
                    <span className="text-foreground">{a.title}</span>
                  </div>
                ))}
                {report.data.activities.length > 20 && (
                  <p className="text-xs text-muted-foreground">…and {report.data.activities.length - 20} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);

  useEffect(() => {
    getReports().then(r => setReports(r.items)).finally(() => setLoading(false));
  }, []);

  async function handleGenerate(type: "daily" | "weekly" | "monthly") {
    setGenerating(true);
    try {
      const now = new Date();
      let start: Date, end: Date;

      if (type === "daily") {
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else if (type === "weekly") {
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        start = startOfMonth(now);
        end = endOfMonth(now);
      }

      const report = await generateReport({
        type,
        period_start: format(start, "yyyy-MM-dd"),
        period_end: format(end, "yyyy-MM-dd"),
      });
      setReports(prev => [report, ...prev]);
      setSelected(report);
    } finally {
      setGenerating(false);
    }
  }

  function handleDelete(id: string) {
    deleteReport(id).then(() => setReports(prev => prev.filter(r => r.id !== id)));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generated summaries of your work.</p>
        </div>

        <div className="flex items-center gap-2">
          {(["daily", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleGenerate(type)}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border text-sm text-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50 capitalize"
            >
              <Plus className="w-3.5 h-3.5" />
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No reports yet"
          description="Generate a daily, weekly, or monthly report to summarize your work."
          action={
            <button onClick={() => handleGenerate("daily")}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Generate Today's Report
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(r => (
            <ReportCard key={r.id} report={r} onDelete={handleDelete} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected && <ReportDetailModal report={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
