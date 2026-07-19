export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  activity_count: number;
  last_activity_at: string | null;
  tags: Tag[];
}

export interface ProjectRef {
  id: string;
  name: string;
  color: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
  project: ProjectRef | null;
  tags: Tag[];
}

export interface Report {
  id: string;
  type: "daily" | "weekly" | "monthly";
  title: string;
  period_start: string;
  period_end: string;
  summary: string | null;
  data: ReportData | null;
  created_at: string;
}

export interface ReportData {
  activity_count: number;
  type_breakdown: { type: string; count: number }[];
  top_projects: { id: string; name: string; count: number }[];
  activities: {
    id: string;
    type: string;
    title: string;
    occurred_at: string;
    project: string | null;
  }[];
}

export interface DashboardStats {
  today_count: number;
  week_count: number;
  month_count: number;
  active_projects: number;
  total_activities: number;
  streak_days: number;
  daily_trend: { date: string; count: number }[];
  type_breakdown: { type: string; count: number }[];
  busiest_hour: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface SearchResult {
  type: "activity" | "project" | "tag";
  id: string;
  title: string;
  subtitle: string | null;
  project_name: string | null;
  occurred_at: string | null;
  created_at: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export const ACTIVITY_TYPES = [
  "file_edit",
  "git_commit",
  "git_push",
  "note",
  "terminal",
  "browser_visit",
  "project_created",
  "project_updated",
  "meeting",
  "research",
  "review",
  "deploy",
  "test",
  "build",
  "documentation",
  "bug_fix",
  "feature",
  "refactor",
  "manual",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];
