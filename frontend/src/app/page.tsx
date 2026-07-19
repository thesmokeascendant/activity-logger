"use client";

import { useEffect, useState } from "react";
import { Flame, Activity, FolderOpen, Calendar, TrendingUp, Clock } from "lucide-react";
import { getDashboard, getActivities } from "@/lib/api";
import { DashboardStats, Activity as ActivityType } from "@/types";
import { TrendChart } from "@/components/charts/TrendChart";
import { TypeBreakdownChart } from "@/components/charts/TypeBreakdownChart";
import { ActivityIcon } from "@/components/shared/ActivityIcon";
import { StatCardSkeleton, ActivityRowSkeleton } from "@/components/shared/Skeleton";
import { formatRelative, getTypeLabel, formatHour } from "@/lib/utils";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}

function StatCard({ label, value, sub, icon: Icon, accent = "text-primary" }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      getActivities({ page_size: "8", sort_by: "occurred_at", sort_dir: "desc" }),
    ])
      .then(([s, a]) => {
        setStats(s);
        setRecent(a.items);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your work history at a glance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              label="Today"
              value={stats.today_count}
              sub={stats.today_count === 1 ? "activity logged" : "activities logged"}
              icon={Activity}
            />
            <StatCard
              label="This Week"
              value={stats.week_count}
              sub="activities"
              icon={Calendar}
              accent="text-emerald-400"
            />
            <StatCard
              label="Active Projects"
              value={stats.active_projects}
              sub="in progress"
              icon={FolderOpen}
              accent="text-amber-400"
            />
            <StatCard
              label="Streak"
              value={`${stats.streak_days}d`}
              sub={stats.streak_days > 0 ? "consecutive days" : "start logging today"}
              icon={Flame}
              accent="text-orange-400"
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">Activity Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-44">
            {loading ? (
              <div className="h-full bg-muted/30 rounded-lg animate-pulse" />
            ) : stats ? (
              <TrendChart data={stats.daily_trend} />
            ) : null}
          </div>
        </div>

        {/* Right column: type breakdown + busiest hour */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">By Type</h2>
            <div className="h-40">
              {loading ? (
                <div className="h-full bg-muted/30 rounded-lg animate-pulse" />
              ) : stats ? (
                <TypeBreakdownChart data={stats.type_breakdown.slice(0, 6)} />
              ) : null}
            </div>
          </div>

          {!loading && stats?.busiest_hour != null && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peak hour</p>
                <p className="text-sm font-medium text-foreground">
                  {formatHour(stats.busiest_hour)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-foreground">Recent Activity</h2>
          <Link
            href="/timeline"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => <ActivityRowSkeleton key={i} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No activities yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &ldquo;Log Activity&rdquo; to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors"
              >
                <ActivityIcon type={activity.type} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {getTypeLabel(activity.type)}
                    </span>
                    {activity.project && (
                      <>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {activity.project.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {formatRelative(activity.occurred_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
