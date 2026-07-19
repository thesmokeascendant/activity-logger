import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string, fmt = "MMM d, yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return dateStr;
  }
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

const TYPE_LABELS: Record<string, string> = {
  file_edit: "File Edit",
  git_commit: "Git Commit",
  git_push: "Git Push",
  note: "Note",
  terminal: "Terminal",
  browser_visit: "Browser Visit",
  project_created: "Project Created",
  project_updated: "Project Updated",
  meeting: "Meeting",
  research: "Research",
  review: "Review",
  deploy: "Deploy",
  test: "Test",
  build: "Build",
  documentation: "Documentation",
  bug_fix: "Bug Fix",
  feature: "Feature",
  refactor: "Refactor",
  manual: "Manual",
};

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

const TYPE_COLORS: Record<string, string> = {
  git_commit: "#10b981",
  git_push: "#059669",
  file_edit: "#6366f1",
  note: "#f59e0b",
  terminal: "#8b5cf6",
  browser_visit: "#14b8a6",
  meeting: "#ec4899",
  research: "#3b82f6",
  feature: "#22c55e",
  bug_fix: "#ef4444",
  deploy: "#f97316",
  refactor: "#a855f7",
  documentation: "#06b6d4",
  test: "#84cc16",
  build: "#fb923c",
  review: "#e879f9",
  manual: "#94a3b8",
};

export function getTypeColor(type: string): string {
  return TYPE_COLORS[type] || "#94a3b8";
}

const TYPE_ICONS: Record<string, string> = {
  git_commit: "GitCommit",
  git_push: "GitBranch",
  file_edit: "FileEdit",
  note: "StickyNote",
  terminal: "Terminal",
  browser_visit: "Globe",
  meeting: "Users",
  research: "BookOpen",
  feature: "Sparkles",
  bug_fix: "Bug",
  deploy: "Rocket",
  refactor: "RefreshCw",
  documentation: "FileText",
  test: "FlaskConical",
  build: "Hammer",
  review: "Eye",
  manual: "PenLine",
  project_created: "FolderPlus",
  project_updated: "FolderEdit",
};

export function getTypeIconName(type: string): string {
  return TYPE_ICONS[type] || "Activity";
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}
