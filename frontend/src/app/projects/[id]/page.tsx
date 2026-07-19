"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Activity as ActivityIcon2, Calendar, Plus } from "lucide-react";
import { getProject, getActivities, deleteProject } from "@/lib/api";
import { Project, Activity } from "@/types";
import { ActivityIcon } from "@/components/shared/ActivityIcon";
import { Skeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { QuickAddModal } from "@/components/shared/QuickAddModal";
import { formatRelative, formatDateTime, getTypeLabel, pluralize } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    Promise.all([
      getProject(id),
      getActivities({ project_id: id, page_size: "50", sort_by: "occurred_at", sort_dir: "desc" }),
    ]).then(([p, a]) => {
      setProject(p);
      setActivities(a.items);
      setTotal(a.total);
    }).catch(() => router.push("/projects"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!confirm(`Delete "${project?.name}" and all its activities?`)) return;
    await deleteProject(id);
    router.push("/projects");
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Projects
      </button>

      {/* Project header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
            )}
            {project.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {project.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${tag.color}18`, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Log
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ActivityIcon2 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Activities</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Last Active</span>
          </div>
          <p className="text-sm font-medium">
            {project.last_activity_at ? formatRelative(project.last_activity_at) : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Created</span>
          </div>
          <p className="text-sm font-medium">{formatRelative(project.created_at)}</p>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium">Activity Timeline</h2>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon2}
            title="No activities yet"
            description="Log your first activity for this project."
            action={
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Log Activity
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/40 transition-colors">
                <ActivityIcon type={activity.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{activity.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{getTypeLabel(activity.type)}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatRelative(activity.occurred_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <QuickAddModal
          defaultProjectId={id}
          onClose={() => {
            setShowAdd(false);
            // Refresh
            getActivities({ project_id: id, page_size: "50", sort_by: "occurred_at", sort_dir: "desc" })
              .then(a => { setActivities(a.items); setTotal(a.total); });
          }}
        />
      )}
    </div>
  );
}
