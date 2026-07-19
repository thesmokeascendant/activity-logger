"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { getActivities, getProjects } from "@/lib/api";
import { Activity, Project, ACTIVITY_TYPES } from "@/types";
import { ActivityIcon } from "@/components/shared/ActivityIcon";
import { ActivityRowSkeleton, Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { formatDateTime, getTypeLabel, formatRelative } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Clock } from "lucide-react";

const PAGE_SIZE = 25;

export default function TimelinePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getProjects({ page_size: "100" }).then((r) => setProjects(r.items)).catch(() => {});
  }, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(PAGE_SIZE),
        sort_by: "occurred_at",
        sort_dir: sortDir,
      };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (projectFilter) params.project_id = projectFilter;

      const result = await getActivities(params);
      setActivities(result.items);
      setTotal(result.total);
      setPages(result.pages);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, projectFilter, sortDir]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function clearFilters() {
    setSearch("");
    setTypeFilter("");
    setProjectFilter("");
    setPage(1);
  }

  const hasFilters = search || typeFilter || projectFilter;

  // Group activities by date
  const grouped: Record<string, Activity[]> = {};
  for (const a of activities) {
    try {
      const d = format(parseISO(a.occurred_at), "yyyy-MM-dd");
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(a);
    } catch {
      if (!grouped["unknown"]) grouped["unknown"] = [];
      grouped["unknown"].push(a);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total > 0 ? `${total} activities` : "Your complete work history"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search activities…"
            className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>{getTypeLabel(t)}</option>
          ))}
        </select>

        {/* Project filter */}
        <select
          value={projectFilter}
          onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Sort direction */}
        <button
          onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`} />
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Activity list grouped by date */}
      {loading ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <ActivityRowSkeleton key={i} />)}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No activities found"
          description={hasFilters ? "Try adjusting your filters." : "Start logging your work to build your timeline."}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {date !== "unknown"
                    ? format(parseISO(date), "EEEE, MMMM d, yyyy")
                    : "Unknown date"}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {items.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/40 transition-colors"
                  >
                    <ActivityIcon type={activity.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {getTypeLabel(activity.type)}
                        </span>
                        {activity.project && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${activity.project.color}18`,
                                color: activity.project.color,
                              }}
                            >
                              {activity.project.name}
                            </span>
                          </>
                        )}
                        {activity.tags.length > 0 && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            {activity.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${tag.color}18`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums whitespace-nowrap">
                      {format(parseISO(activity.occurred_at), "h:mm a")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Pagination
            page={page}
            pages={pages}
            total={total}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
